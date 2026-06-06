import { withApi } from '@/lib/api/with-api';
import { notFound } from '@/lib/api/envelope';
import {
  getGeneration,
  refreshGeneration,
  cancelGeneration,
  toGenerationDto,
} from '@/lib/api/generation-dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(
  async (_req, ctx) => {
    const row = await getGeneration(ctx.apiKey!.id, ctx.params.id);
    if (!row) {
      throw notFound('Generation not found');
    }
    const refreshed = await refreshGeneration(row);
    return { data: toGenerationDto(refreshed) };
  },
  { scope: 'read' },
);

export const DELETE = withApi(
  async (_req, ctx) => {
    const row = await cancelGeneration(ctx.apiKey!.id, ctx.params.id);
    if (!row) {
      throw notFound('Generation not found');
    }
    return { data: toGenerationDto(row) };
  },
  { scope: 'write', idempotent: true },
);
