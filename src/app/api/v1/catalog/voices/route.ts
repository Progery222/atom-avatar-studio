import { withApi } from '@/lib/api/with-api';
import { badRequest } from '@/lib/api/envelope';
import { listVoices } from '@/lib/heygen';
import { GEMINI_FLASH_VOICES } from '@/constants/gemini-flash-tts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const ELEVENLABS_VOICES = ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam'];

export const GET = withApi(
  async (_req, ctx) => {
    const provider = ctx.searchParams.get('provider');
    if (!provider) {
      throw badRequest('Query param "provider" is required');
    }

    switch (provider) {
      case 'heygen': {
        const gender = ctx.searchParams.get('gender') ?? undefined;
        const language = ctx.searchParams.get('language') ?? undefined;
        const voices = await listVoices({ gender, language });
        return {
          data: voices.map((v) => ({
            id: v.voice_id,
            name: v.name,
            gender: v.gender,
            language: v.language,
            preview_url: v.preview_audio_url ?? null,
          })),
        };
      }
      case 'gemini-flash':
        return {
          data: GEMINI_FLASH_VOICES.map((v) => ({
            id: v.id,
            name: v.name,
            gender: v.gender,
            description: v.description,
          })),
        };
      case 'openai':
        return { data: OPENAI_VOICES.map((id) => ({ id, name: id })) };
      case 'elevenlabs':
        return { data: ELEVENLABS_VOICES.map((id) => ({ id, name: id })) };
      default:
        throw badRequest(`Unknown voices provider "${provider}"`);
    }
  },
  { scope: 'read' },
);
