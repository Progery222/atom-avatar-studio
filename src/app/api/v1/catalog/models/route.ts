import { withApi } from '@/lib/api/with-api';
import { AI_MODELS } from '@/constants/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GPT_IMAGE_CAPS = {
  resolutions: ['1K', '2K', '4K'],
  aspect_ratios: ['auto', '1:1', '9:16', '16:9', '4:3', '3:4'],
};
const HEYGEN_CAPS = {
  resolutions: ['720p', '1080p', '4k'],
  aspect_ratios: ['16:9', '9:16'],
};

export const GET = withApi(
  () => {
    const models = [
      ...AI_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        // expose ByteDance under the external provider name "seedance"
        provider: m.provider === 'bytedance' ? 'seedance' : m.provider,
        kind: 'video' as const,
        capabilities: {
          resolutions: m.supportedResolutions,
          aspect_ratios: m.supportedAspectRatios,
          can_upload_audio: m.canUploadAudio,
          has_camera_effects: m.hasCameraEffects,
        },
        pricing: m.pricing ?? null,
      })),
      {
        id: 'gpt-image-2-text-to-image',
        name: 'GPT Image — Text to Image',
        provider: 'gpt-image',
        kind: 'image' as const,
        capabilities: GPT_IMAGE_CAPS,
        pricing: null,
      },
      {
        id: 'gpt-image-2-image-to-image',
        name: 'GPT Image — Image to Image',
        provider: 'gpt-image',
        kind: 'image' as const,
        capabilities: GPT_IMAGE_CAPS,
        pricing: null,
      },
      {
        id: 'heygen/image',
        name: 'HeyGen — Image to Video',
        provider: 'heygen',
        kind: 'video' as const,
        capabilities: HEYGEN_CAPS,
        pricing: null,
      },
      {
        id: 'heygen/avatar',
        name: 'HeyGen — Photo Avatar',
        provider: 'heygen',
        kind: 'video' as const,
        capabilities: HEYGEN_CAPS,
        pricing: null,
      },
    ];
    return { data: models };
  },
  { scope: 'read' },
);
