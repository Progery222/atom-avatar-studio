import { withApi } from '@/lib/api/with-api';
import { SERVICE_NAME, API_VERSION } from '@/lib/api/envelope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CAPABILITIES = [
  'generations.video.seedance',
  'generations.video.kling',
  'generations.video.heygen',
  'generations.image.gpt-image',
  'generations.speech',
  'actions.upload',
  'catalog.models',
  'catalog.voices',
  'catalog.presets',
  'account.credits',
];

export const GET = withApi(
  () => ({
    data: {
      service: SERVICE_NAME,
      api_version: API_VERSION,
      capabilities: CAPABILITIES,
      documentation_url: '/api/v1/openapi.json',
    },
  }),
  { scope: 'read' },
);
