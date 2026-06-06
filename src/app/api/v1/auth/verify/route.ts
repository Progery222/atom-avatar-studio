import { withApi } from '@/lib/api/with-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(
  (_req, ctx) => {
    const key = ctx.apiKey!;
    return {
      data: {
        valid: true,
        key_id: key.id,
        scopes: key.scopes,
        expires_at: key.expiresAt ? key.expiresAt.toISOString() : null,
      },
    };
  },
  { scope: 'read' },
);
