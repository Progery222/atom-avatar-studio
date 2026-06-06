import { z } from 'zod';
import { GPT_IMAGE_CONSTRAINTS, GPT_IMAGE_LIMITS } from '@/constants/gpt-image';

// ── Shared enums ─────────────────────────────────────────────────────────────
export const TTS_PROVIDERS = ['openai', 'elevenlabs', 'gemini', 'gemini-flash'] as const;

const ttsTuning = {
  voice_id: z.string().min(1).optional(),
  language_code: z.string().min(1).optional(),
  voice_name: z.string().min(1).optional(),
};

// ── Video: Seedance (KIE / ByteDance) ────────────────────────────────────────
const seedanceObj = z.object({
  provider: z.literal('seedance'),
  image_url: z.string().url(),
  spoken_text: z.string().min(1).optional(),
  audio_url: z.string().url().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  duration: z.number().int().min(1).max(30).optional(),
  resolution: z.enum(['480p', '720p']).optional(),
  aspect_ratio: z.enum(['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive']).optional(),
  web_search: z.boolean().optional(),
  nsfw_checker: z.boolean().optional(),
  emotion: z.enum(['neutral', 'joyful', 'serious', 'empathetic', 'sarcastic']).optional(),
  dynamism: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  camera_style: z
    .enum(['static', 'dramatic_push', 'side_sweep', 'vlog_handheld', 'orbital_360', 'floating'])
    .optional(),
  lighting_id: z.enum(['studio', 'neon', 'dramatic', 'golden_hour', 'natural']).optional(),
  camera_effect_prompt: z.string().optional(),
});

// ── Video: Kling (KIE) — needs external audio (or spoken_text → auto-TTS) ─────
const klingObj = z.object({
  provider: z.literal('kling'),
  model: z.enum(['kling/ai-avatar-standard', 'kling/ai-avatar-pro']).optional(),
  image_url: z.string().url(),
  audio_url: z.string().url().optional(),
  spoken_text: z.string().min(1).optional(),
  tts: z.object({ provider: z.enum(TTS_PROVIDERS).optional(), ...ttsTuning }).optional(),
  camera_effect_prompt: z.string().optional(),
});

// ── Video: HeyGen ────────────────────────────────────────────────────────────
const heygenObj = z.object({
  provider: z.literal('heygen'),
  source_type: z.enum(['image', 'avatar']),
  image_url: z.string().url().optional(),
  avatar_id: z.string().min(1).optional(),
  script: z.string().min(1).optional(),
  voice_id: z.string().min(1).optional(),
  audio_url: z.string().url().optional(),
  resolution: z.enum(['720p', '1080p', '4k']).optional(),
  aspect_ratio: z.enum(['16:9', '9:16']).optional(),
  remove_background: z.boolean().optional(),
  background: z
    .object({
      type: z.enum(['color', 'image']),
      value: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  voice_settings: z
    .object({
      speed: z.number().min(0.5).max(1.5).optional(),
      pitch: z.number().min(-50).max(50).optional(),
      volume: z.number().min(0).max(1).optional(),
      locale: z.string().optional(),
    })
    .optional(),
  motion_prompt: z.string().optional(),
  expressiveness: z.enum(['high', 'medium', 'low']).optional(),
});

// ── Image: GPT-Image (KIE) ───────────────────────────────────────────────────
const gptImageObj = z.object({
  provider: z.literal('gpt-image'),
  mode: z.enum(['text-to-image', 'image-to-image']),
  prompt: z.string().min(1).max(GPT_IMAGE_LIMITS.maxPromptLength),
  aspect_ratio: z.enum(['auto', '1:1', '9:16', '16:9', '4:3', '3:4']).optional(),
  resolution: z.enum(['1K', '2K', '4K']).optional(),
  input_urls: z.array(z.string().url()).min(1).max(GPT_IMAGE_LIMITS.maxInputUrls).optional(),
});

// ── Speech: TTS providers (one literal variant each) ─────────────────────────
const speechObjs = TTS_PROVIDERS.map((p) =>
  z.object({ provider: z.literal(p), text: z.string().min(1), ...ttsTuning }),
);

/** Plain discriminated union (used as the OpenAPI request schema). */
export const createGenerationRequestUnion = z.discriminatedUnion('provider', [
  seedanceObj,
  klingObj,
  heygenObj,
  gptImageObj,
  ...speechObjs,
]);

/** Validation schema with provider-specific cross-field checks (→ 422 details). */
export const createGenerationSchema = createGenerationRequestUnion.superRefine((v, ctx) => {
  if (v.provider === 'kling') {
    if (!v.audio_url && !v.spoken_text) {
      ctx.addIssue({ code: 'custom', message: 'Either audio_url or spoken_text is required for Kling', path: ['audio_url'] });
    }
  } else if (v.provider === 'heygen') {
    if (v.source_type === 'image' && !v.image_url) {
      ctx.addIssue({ code: 'custom', message: 'image_url is required when source_type is "image"', path: ['image_url'] });
    }
    if (v.source_type === 'avatar' && !v.avatar_id) {
      ctx.addIssue({ code: 'custom', message: 'avatar_id is required when source_type is "avatar"', path: ['avatar_id'] });
    }
    const hasScript = Boolean(v.script);
    const hasAudio = Boolean(v.audio_url);
    if (!hasScript && !hasAudio) {
      ctx.addIssue({ code: 'custom', message: 'Either script (+voice_id) or audio_url is required', path: ['script'] });
    }
    if (hasScript && hasAudio) {
      ctx.addIssue({ code: 'custom', message: 'Provide either script or audio_url, not both', path: ['audio_url'] });
    }
    if (hasScript && !v.voice_id) {
      ctx.addIssue({ code: 'custom', message: 'voice_id is required when script is provided', path: ['voice_id'] });
    }
  } else if (v.provider === 'gpt-image') {
    if (v.mode === 'image-to-image' && (!v.input_urls || v.input_urls.length === 0)) {
      ctx.addIssue({ code: 'custom', message: 'input_urls is required for image-to-image', path: ['input_urls'] });
    }
    const invalid = GPT_IMAGE_CONSTRAINTS.invalidCombos.some(
      (c) => c.aspectRatio === v.aspect_ratio && c.resolution === v.resolution,
    );
    if (invalid) {
      ctx.addIssue({ code: 'custom', message: `${v.aspect_ratio} does not support ${v.resolution}`, path: ['resolution'] });
    }
    if (v.aspect_ratio === 'auto' && v.resolution && v.resolution !== GPT_IMAGE_CONSTRAINTS.autoResolutionLimit) {
      ctx.addIssue({ code: 'custom', message: 'aspect_ratio "auto" only supports 1K resolution', path: ['resolution'] });
    }
  }
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
export type SeedanceInput = z.infer<typeof seedanceObj>;
export type KlingInput = z.infer<typeof klingObj>;
export type HeygenInput = z.infer<typeof heygenObj>;
export type GptImageInput = z.infer<typeof gptImageObj>;
