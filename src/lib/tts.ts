import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ProxyAgent } from 'undici';

export type TTSProvider = 'openai' | 'elevenlabs' | 'gemini' | 'gemini-flash';

export interface GeminiTTSOptions {
  voice?: string;
  sceneStyle?: string;
  speakingRate?: number;
  pitch?: number;
  audioEncoding?: string;
  locale?: string;
}

export interface GeminiFlashTTSOptions {
  voiceName?: string;
  languageCode?: string;
}

export interface TTSResult {
  buffer: Uint8Array;
  mimeType: string;
}

interface GoogleApiKeyCandidate {
  key: string;
  source: string;
}

interface GeminiAudioPayload {
  data: string;
  mimeType: string;
}

function pcmToWav(pcmBuffer: Uint8Array, mimeType: string): Uint8Array {
  let sampleRate = 24000;
  let channels = 1;

  const rateMatch = mimeType.match(/rate=(\d+)/);
  if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);

  const channelMatch = mimeType.match(/channels=(\d+)/);
  if (channelMatch) channels = parseInt(channelMatch[1], 10);

  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return new Uint8Array(Buffer.concat([header, Buffer.from(pcmBuffer)]));
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const elevenlabs = process.env.ELEVENLABS_API_KEY ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY }) : null;

const HTTPS_PROXY =
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy;

const proxyDispatcher = HTTPS_PROXY ? new ProxyAgent(HTTPS_PROXY) : undefined;

if (proxyDispatcher && HTTPS_PROXY) {
  console.log(`[TTS] Proxy enabled: ${HTTPS_PROXY.replace(/\/\/[^@]+@/, '//***@')}`);
}

function getEnvKey(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('your_')) {
    return undefined;
  }
  return value;
}

function getUniqueApiKeys(names: string[]): GoogleApiKeyCandidate[] {
  const seen = new Set<string>();
  const candidates: GoogleApiKeyCandidate[] = [];

  for (const name of names) {
    const key = getEnvKey(name);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    candidates.push({ key, source: name });
  }

  return candidates;
}

function getGeminiDeveloperApiKeys(): GoogleApiKeyCandidate[] {
  return getUniqueApiKeys([
    'GOOGLE_AI_STUDIO_API_KEY',
    'GEMINI_DEVELOPER_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY_2',
    'GEMINI_API_KEY',
  ]);
}

function getCloudTtsApiKeys(): GoogleApiKeyCandidate[] {
  return getUniqueApiKeys([
    'GOOGLE_CLOUD_TTS_API_KEY',
    'GOOGLE_CLOUD_API_KEY',
    'GEMINI_API_KEY',
    'GEMINI_API_KEY_2',
    'GOOGLE_API_KEY',
  ]);
}

function buildGoogleApiErrorMessage(
  responseStatus: number,
  data: Record<string, unknown>,
  fallbackText?: string
): string {
  const errorObj = data.error as Record<string, unknown> | undefined;
  const status = errorObj?.status as string | undefined;
  const code = (errorObj?.code as number | undefined) ?? responseStatus;
  const details = Array.isArray(errorObj?.details) ? (errorObj?.details as Array<Record<string, unknown>>) : [];
  const reason = details.find((detail) => typeof detail?.reason === 'string')?.reason as string | undefined;
  const message =
    (errorObj?.message as string | undefined) ||
    fallbackText ||
    `Google API error: ${responseStatus}`;

  const prefix = [status, reason, String(code)].filter(Boolean).join(' | ');
  return prefix ? `${prefix}: ${message}` : message;
}

async function googleFetch(
  url: string,
  body: unknown,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const bodyJson = JSON.stringify(body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-goog-api-key'] = apiKey;
  }

  const doFetch = async () => {
    if (proxyDispatcher) {
      const { fetch: undiciFetch } = await import('undici');
      return undiciFetch(url, {
        method: 'POST',
        headers,
        body: bodyJson,
        dispatcher: proxyDispatcher,
      });
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: bodyJson,
    });
  };

  const response = await doFetch();
  const responseText = await response.text();
  console.log(`[googleFetch] ${url} -> ${response.status} (${responseText.length} bytes)`);

  let data: Record<string, unknown>;
  try {
    data = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(buildGoogleApiErrorMessage(response.status, data, responseText.slice(0, 300)));
  }

  return data;
}

function shouldTryNextGoogleKey(message: string): boolean {
  const normalized = message.toLowerCase();

  return [
    'api_key',
    'api key',
    'permission_denied',
    'service_disabled',
    'resource_exhausted',
    'quota',
    'limit',
    'are blocked',
    'has not been used in project',
    'enable it by visiting',
    'consumer invalid',
  ].some((needle) => normalized.includes(needle));
}

function shouldRetryGoogleRequest(message: string): boolean {
  const normalized = message.toLowerCase();
  return [
    'timeout',
    'connect_timeout',
    'internal error encountered',
    'internal',
    '503',
    'deadline exceeded',
  ].some((needle) => normalized.includes(needle));
}

function extractAudioFromGeminiResponse(response: unknown): GeminiAudioPayload | null {
  const candidates = (response as { candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  }> })?.candidates;

  if (!Array.isArray(candidates)) {
    return null;
  }

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (const part of parts) {
      const inlineData = part?.inlineData;
      if (inlineData?.data) {
        return {
          data: inlineData.data,
          mimeType: inlineData.mimeType || 'audio/l16; rate=24000; channels=1',
        };
      }
    }
  }

  return null;
}

const AUDIO_TAGS_PATTERN =
  /\[(laughs?|sigh|sighs?|gasps?|whispers?|shouts?|pauses?|clears throat|coughs?|sniffs?|mumbles?|cheers?|screams?|yawns?)\]/gi;

function stripUnsupportedTags(text: string): string {
  const stripped = text.replace(AUDIO_TAGS_PATTERN, '');
  return stripped.replace(/\s+/g, ' ').trim();
}

async function generateGeminiTTS(
  text: string,
  options: GeminiTTSOptions = {}
): Promise<Buffer> {
  const apiKeys = getCloudTtsApiKeys();
  if (apiKeys.length === 0) {
    throw new Error(
      'No Google Cloud TTS key configured. Set GOOGLE_CLOUD_TTS_API_KEY or reuse GEMINI_API_KEY for texttospeech.googleapis.com.'
    );
  }

  const hasAudioTags = AUDIO_TAGS_PATTERN.test(text);
  const cleanText = stripUnsupportedTags(text);

  if (hasAudioTags) {
    console.warn('[Google Cloud TTS] Audio effect tags are not supported and were removed.');
  }

  const {
    voice = 'en-US-Studio-O',
    speakingRate = 1.0,
    pitch = 0.0,
    locale = 'en-US',
  } = options;

  let lastError: Error | null = null;

  for (const candidate of apiKeys) {
    try {
      const data = await googleFetch(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        {
          input: { text: cleanText },
          voice: {
            languageCode: locale,
            name: voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate,
            pitch,
          },
        },
        candidate.key
      );

      const audioContent = data.audioContent as string | undefined;
      if (!audioContent) {
        throw new Error('No audio content in response');
      }

      console.log(`[Google Cloud TTS] Success with ${candidate.source}`);
      return Buffer.from(audioContent, 'base64');
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message;
      console.error(`[Google Cloud TTS] ${candidate.source} failed: ${errorMessage}`);

      if (shouldTryNextGoogleKey(errorMessage)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Google Cloud TTS failed with all keys. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function generateGeminiFlashTTS(
  text: string,
  options: GeminiFlashTTSOptions = {}
): Promise<TTSResult> {
  const apiKeys = getGeminiDeveloperApiKeys();
  if (apiKeys.length === 0) {
    throw new Error(
      'No Gemini Developer API key configured. Set GOOGLE_API_KEY, GOOGLE_AI_STUDIO_API_KEY, or GEMINI_API_KEY_2 for Gemini Flash TTS.'
    );
  }

  const { voiceName = 'Kore', languageCode } = options;

  let ttsText = text.trim();
  if (languageCode) {
    ttsText = `Use locale ${languageCode}. ${ttsText}`;
  }

  const ttsPrefixes = /^(say|read|speak|pronounce|use locale|произнеси|скажи|прочитай|читай)/i;
  if (!ttsPrefixes.test(ttsText) && !ttsText.startsWith('[')) {
    ttsText = `Say clearly: ${ttsText}`;
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (const candidate of apiKeys) {
    const ai = new GoogleGenAI({ apiKey: candidate.key });

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: ttsText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        });
        let audioPayload = extractAudioFromGeminiResponse(response);

        // Fallback to direct REST response parsing to handle edge cases where SDK-normalized
        // object shape differs from expectations.
        if (!audioPayload) {
          const restData = await googleFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent`,
            {
              contents: [{ parts: [{ text: ttsText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName,
                    },
                  },
                },
              },
            },
            candidate.key
          );
          audioPayload = extractAudioFromGeminiResponse(restData);
        }

        if (!audioPayload?.data) {
          throw new Error('Gemini Flash returned response without inline audio data');
        }

        const audioBase64 = audioPayload.data;
        const audioMimeType = audioPayload.mimeType;

        let audioBuffer: Uint8Array<ArrayBufferLike> = new Uint8Array(Buffer.from(audioBase64, 'base64'));
        let resultMimeType = audioMimeType;

        if (audioMimeType.startsWith('audio/l16') || audioMimeType.startsWith('audio/pcm')) {
          audioBuffer = pcmToWav(audioBuffer, audioMimeType);
          resultMimeType = 'audio/wav';
        }

        console.log(`[Gemini Flash TTS] Success with ${candidate.source}, mimeType: ${audioMimeType}`);
        return { buffer: audioBuffer, mimeType: resultMimeType };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        console.error(`[Gemini Flash TTS] ${candidate.source} attempt ${attempt}/${maxRetries}: ${errorMessage}`);

        if (shouldTryNextGoogleKey(errorMessage)) {
          break;
        }

        if (attempt < maxRetries && shouldRetryGoogleRequest(errorMessage)) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (attempt === maxRetries) {
          break;
        }

        throw error;
      }
    }
  }

  throw new Error(`Gemini Flash TTS failed with all keys. Last error: ${lastError?.message || 'Unknown error'}`);
}

export async function generateTTS(
  provider: TTSProvider,
  text: string,
  voiceId?: string,
  geminiOptions?: GeminiTTSOptions | GeminiFlashTTSOptions
): Promise<TTSResult> {
  if (provider === 'openai') {
    if (!openai) throw new Error('OPENAI_API_KEY is not set');

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voiceId || 'alloy',
      input: text,
    });

    const buffer = new Uint8Array(await mp3.arrayBuffer());
    return { buffer, mimeType: 'audio/mpeg' };
  }

  if (provider === 'elevenlabs') {
    if (!elevenlabs) throw new Error('ELEVENLABS_API_KEY is not set');

    const stream = await elevenlabs.textToSpeech.convert(voiceId || 'Rachel', {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    const arrayBuffer = await new Response(stream as unknown as ReadableStream).arrayBuffer();
    return { buffer: new Uint8Array(arrayBuffer), mimeType: 'audio/mpeg' };
  }

  if (provider === 'gemini') {
    const buffer = await generateGeminiTTS(text, geminiOptions as GeminiTTSOptions | undefined);
    return { buffer: new Uint8Array(buffer), mimeType: 'audio/mpeg' };
  }

  if (provider === 'gemini-flash') {
    return generateGeminiFlashTTS(text, geminiOptions as GeminiFlashTTSOptions | undefined);
  }

  throw new Error('Invalid TTS provider');
}
