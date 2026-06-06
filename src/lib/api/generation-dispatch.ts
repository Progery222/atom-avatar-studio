import { and, asc, desc, eq, gt, lt, or } from 'drizzle-orm';
import { getDb } from './db';
import { generations, type GenerationRow, type GenerationKind, type GenerationStatus } from './schema';
import { newId } from './keys';
import { badRequest } from './envelope';
import {
  encodeCursor,
  decodeCursor,
  type SortDirection,
} from './pagination';
import { mapKieState, mapHeygenStatus, isTerminal, extractKieVideoResult } from './generation-mapper';
import { createKieTask, getKieTaskStatus, type CreateTaskPayload } from '@/lib/kie';
import { createVideo, getVideoStatus } from '@/lib/heygen';
import { createGptImageTask, pollGptImageTask } from '@/lib/gpt-image';
import { generateTTS, type GeminiTTSOptions, type GeminiFlashTTSOptions } from '@/lib/tts';
import { putObject } from '@/lib/storage';
import { GPT_IMAGE_MODELS } from '@/constants/gpt-image';
import type { HeyGenCreateVideoRequest } from '@/types/heygen';
import type {
  CreateGenerationInput,
  SeedanceInput,
  KlingInput,
  HeygenInput,
  GptImageInput,
} from '@/app/api/v1/_schemas/generations';

const GEN_STATUSES: GenerationStatus[] = ['queued', 'processing', 'succeeded', 'failed', 'canceled'];
const GEN_KINDS: GenerationKind[] = ['video', 'image', 'speech'];

interface SpeechTuning {
  provider: 'openai' | 'elevenlabs' | 'gemini' | 'gemini-flash';
  voice_id?: string;
  language_code?: string;
  voice_name?: string;
}

function ttsOptions(t: SpeechTuning): GeminiTTSOptions | GeminiFlashTTSOptions | undefined {
  if (t.provider === 'gemini-flash') {
    return { voiceName: t.voice_name, languageCode: t.language_code };
  }
  if (t.provider === 'gemini') {
    return { voice: t.voice_name, locale: t.language_code };
  }
  return undefined;
}

async function synthesizeAudio(t: SpeechTuning, text: string): Promise<string> {
  const result = await generateTTS(t.provider, text, t.voice_id, ttsOptions(t));
  const ext = result.mimeType === 'audio/wav' ? 'wav' : 'mp3';
  return putObject(`audio/${newId('tts')}.${ext}`, Buffer.from(result.buffer), result.mimeType);
}

async function insertGeneration(values: {
  kind: GenerationKind;
  provider: string;
  model: string;
  status: GenerationStatus;
  providerTaskId: string | null;
  input: unknown;
  result?: unknown;
  error?: { code: string; message: string } | null;
  apiKeyId: string;
}): Promise<GenerationRow> {
  const db = await getDb();
  const now = new Date();
  const row: GenerationRow = {
    id: newId('gen'),
    apiKeyId: values.apiKeyId,
    kind: values.kind,
    provider: values.provider,
    model: values.model,
    status: values.status,
    providerTaskId: values.providerTaskId,
    inputJson: values.input,
    resultJson: values.result ?? null,
    errorJson: values.error ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(generations).values(row);
  return row;
}

// ── Per-provider creation ────────────────────────────────────────────────────
async function createSeedance(apiKeyId: string, input: SeedanceInput): Promise<GenerationRow> {
  const payload: CreateTaskPayload = {
    modelId: 'bytedance/seedance-2-fast',
    imageRefUrl: input.image_url,
    audioRefUrl: input.audio_url,
    spokenText: input.spoken_text,
    gender: input.gender,
    duration: input.duration,
    resolution: input.resolution,
    aspectRatio: input.aspect_ratio,
    webSearch: input.web_search,
    nsfwChecker: input.nsfw_checker,
    promptParams: {
      emotion: input.emotion ?? 'neutral',
      dynamism: input.dynamism ?? 1,
      cameraStyle: input.camera_style ?? 'static',
      lightingId: input.lighting_id ?? 'studio',
      cameraEffectPrompt: input.camera_effect_prompt,
    },
  };
  const task = (await createKieTask(payload)) as { taskId?: string } | undefined;
  return insertGeneration({
    apiKeyId,
    kind: 'video',
    provider: 'seedance',
    model: 'bytedance/seedance-2-fast',
    status: 'queued',
    providerTaskId: task?.taskId ?? null,
    input,
  });
}

async function createKling(apiKeyId: string, input: KlingInput): Promise<GenerationRow> {
  let audioUrl = input.audio_url;
  if (!audioUrl && input.spoken_text) {
    audioUrl = await synthesizeAudio(
      { provider: input.tts?.provider ?? 'openai', voice_id: input.tts?.voice_id, language_code: input.tts?.language_code, voice_name: input.tts?.voice_name },
      input.spoken_text,
    );
  }
  const model = input.model ?? 'kling/ai-avatar-standard';
  const payload: CreateTaskPayload = {
    modelId: model,
    imageRefUrl: input.image_url,
    audioRefUrl: audioUrl,
    promptParams: {
      emotion: 'neutral',
      dynamism: 1,
      // Use a non-preset cameraStyle so buildPrompt falls back to camera_effect_prompt.
      cameraStyle: input.camera_effect_prompt ? '__custom__' : 'static',
      lightingId: 'studio',
      cameraEffectPrompt: input.camera_effect_prompt,
    },
  };
  const task = (await createKieTask(payload)) as { taskId?: string } | undefined;
  return insertGeneration({
    apiKeyId,
    kind: 'video',
    provider: 'kling',
    model,
    status: 'queued',
    providerTaskId: task?.taskId ?? null,
    input,
  });
}

async function createHeygen(apiKeyId: string, input: HeygenInput): Promise<GenerationRow> {
  const shared = {
    script: input.script,
    voice_id: input.voice_id,
    audio_url: input.audio_url,
    resolution: input.resolution,
    aspect_ratio: input.aspect_ratio,
    remove_background: input.remove_background,
    background: input.background,
    voice_settings: input.voice_settings,
    motion_prompt: input.motion_prompt,
    expressiveness: input.expressiveness,
  };
  const request: HeyGenCreateVideoRequest =
    input.source_type === 'image'
      ? { type: 'image', image: { type: 'url', url: input.image_url as string }, ...shared }
      : { type: 'avatar', avatar_id: input.avatar_id as string, ...shared };

  const response = await createVideo(request);
  return insertGeneration({
    apiKeyId,
    kind: 'video',
    provider: 'heygen',
    model: input.source_type === 'image' ? 'heygen/image' : 'heygen/avatar',
    status: 'queued',
    providerTaskId: response.data.video_id,
    input,
  });
}

async function createGptImage(apiKeyId: string, input: GptImageInput): Promise<GenerationRow> {
  const response = await createGptImageTask(input.mode, {
    prompt: input.prompt,
    aspectRatio: input.aspect_ratio,
    resolution: input.resolution,
    inputUrls: input.input_urls,
  });
  return insertGeneration({
    apiKeyId,
    kind: 'image',
    provider: 'gpt-image',
    model: GPT_IMAGE_MODELS[input.mode],
    status: 'queued',
    providerTaskId: response.data.taskId,
    input,
  });
}

async function createSpeech(apiKeyId: string, input: SpeechTuning & { text: string }): Promise<GenerationRow> {
  const audioUrl = await synthesizeAudio(input, input.text);
  return insertGeneration({
    apiKeyId,
    kind: 'speech',
    provider: input.provider,
    model: input.provider,
    status: 'succeeded',
    providerTaskId: null,
    input,
    result: { audio_url: audioUrl },
  });
}

export async function createGeneration(
  apiKeyId: string,
  input: CreateGenerationInput,
): Promise<GenerationRow> {
  switch (input.provider) {
    case 'seedance':
      return createSeedance(apiKeyId, input);
    case 'kling':
      return createKling(apiKeyId, input);
    case 'heygen':
      return createHeygen(apiKeyId, input);
    case 'gpt-image':
      return createGptImage(apiKeyId, input);
    default:
      // openai | elevenlabs | gemini | gemini-flash
      return createSpeech(apiKeyId, input);
  }
}

// ── Polling / refresh ────────────────────────────────────────────────────────
export async function refreshGeneration(row: GenerationRow): Promise<GenerationRow> {
  if (isTerminal(row.status) || !row.providerTaskId) {
    return row;
  }

  let status: GenerationStatus = row.status;
  let result: unknown = row.resultJson;
  let error: { code: string; message: string } | null = row.errorJson;

  if (row.provider === 'seedance' || row.provider === 'kling') {
    const json = (await getKieTaskStatus(row.providerTaskId)) as {
      data?: { state?: string; resultJson?: string; failCode?: string; failMsg?: string };
    };
    const record = json.data ?? {};
    status = mapKieState(record.state);
    if (status === 'succeeded') {
      result = extractKieVideoResult(record.resultJson);
    } else if (status === 'failed') {
      error = { code: record.failCode ?? 'failed', message: record.failMsg ?? 'Generation failed' };
    }
  } else if (row.provider === 'gpt-image') {
    const r = await pollGptImageTask(row.providerTaskId);
    status = mapKieState(r.state);
    if (status === 'succeeded') {
      result = { image_urls: r.resultUrls ?? [] };
    } else if (status === 'failed') {
      error = { code: r.failCode ?? 'failed', message: r.failMsg ?? 'Generation failed' };
    }
  } else if (row.provider === 'heygen') {
    const s = await getVideoStatus(row.providerTaskId);
    status = mapHeygenStatus(s.data.status);
    if (status === 'succeeded') {
      result = { video_url: s.data.video_url ?? null, thumbnail_url: s.data.thumbnail_url ?? null };
    } else if (status === 'failed') {
      error = {
        code: s.data.failure_code ?? 'failed',
        message: s.data.failure_message ?? 'Generation failed',
      };
    }
  }

  if (status === row.status && result === row.resultJson && error === row.errorJson) {
    return row;
  }

  const db = await getDb();
  const updatedAt = new Date();
  await db
    .update(generations)
    .set({ status, resultJson: result, errorJson: error, updatedAt })
    .where(eq(generations.id, row.id));
  return { ...row, status, resultJson: result, errorJson: error, updatedAt };
}

// ── Reads ─────────────────────────────────────────────────────────────────────
export async function getGeneration(apiKeyId: string, id: string): Promise<GenerationRow | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.apiKeyId, apiKeyId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface ListParams {
  limit: number;
  sort: SortDirection;
  cursor: string | null;
  filters: Record<string, string>;
}

export interface ListResult {
  rows: GenerationRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listGenerations(apiKeyId: string, params: ListParams): Promise<ListResult> {
  const db = await getDb();
  const conds = [eq(generations.apiKeyId, apiKeyId)];

  const statusFilter = params.filters.status;
  if (statusFilter) {
    if (!GEN_STATUSES.includes(statusFilter as GenerationStatus)) {
      throw badRequest(`Invalid filter_status "${statusFilter}"`);
    }
    conds.push(eq(generations.status, statusFilter as GenerationStatus));
  }
  const kindFilter = params.filters.kind;
  if (kindFilter) {
    if (!GEN_KINDS.includes(kindFilter as GenerationKind)) {
      throw badRequest(`Invalid filter_kind "${kindFilter}"`);
    }
    conds.push(eq(generations.kind, kindFilter as GenerationKind));
  }

  const cursor = decodeCursor(params.cursor);
  if (cursor) {
    const at = new Date(cursor.createdAt);
    if (params.sort === 'desc') {
      conds.push(
        or(
          lt(generations.createdAt, at),
          and(eq(generations.createdAt, at), lt(generations.id, cursor.id)),
        )!,
      );
    } else {
      conds.push(
        or(
          gt(generations.createdAt, at),
          and(eq(generations.createdAt, at), gt(generations.id, cursor.id)),
        )!,
      );
    }
  }

  const order =
    params.sort === 'desc'
      ? [desc(generations.createdAt), desc(generations.id)]
      : [asc(generations.createdAt), asc(generations.id)];

  const rows = await db
    .select()
    .from(generations)
    .where(and(...conds))
    .orderBy(...order)
    .limit(params.limit + 1);

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ createdAt: last.createdAt.getTime(), id: last.id }) : null;

  return { rows: page, nextCursor, hasMore };
}

export async function cancelGeneration(apiKeyId: string, id: string): Promise<GenerationRow | null> {
  const row = await getGeneration(apiKeyId, id);
  if (!row) {
    return null;
  }
  if (isTerminal(row.status)) {
    return row;
  }
  const db = await getDb();
  const updatedAt = new Date();
  await db
    .update(generations)
    .set({ status: 'canceled', updatedAt })
    .where(eq(generations.id, id));
  return { ...row, status: 'canceled', updatedAt };
}

// ── Public DTO ─────────────────────────────────────────────────────────────────
export interface GenerationDto {
  id: string;
  kind: GenerationKind;
  provider: string;
  model: string;
  status: GenerationStatus;
  result: unknown;
  error: unknown;
  created_at: string;
  updated_at: string;
}

export function toGenerationDto(row: GenerationRow): GenerationDto {
  return {
    id: row.id,
    kind: row.kind,
    provider: row.provider,
    model: row.model,
    status: row.status,
    result: row.resultJson ?? null,
    error: row.errorJson ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
