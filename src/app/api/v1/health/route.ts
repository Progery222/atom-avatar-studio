import { withApi } from '@/lib/api/with-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(
  () => ({ data: { status: 'ok', timestamp: new Date().toISOString() } }),
  { public: true, rateLimit: false },
);
