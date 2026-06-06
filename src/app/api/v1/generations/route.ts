import { z } from 'zod';
import { withApi } from '@/lib/api/with-api';
import { validationError } from '@/lib/api/envelope';
import { parseLimit, parseSort, parseFilters } from '@/lib/api/pagination';
import { createGenerationSchema } from '@/app/api/v1/_schemas/generations';
import {
  createGeneration,
  listGenerations,
  toGenerationDto,
} from '@/lib/api/generation-dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withApi(
  async (_req, ctx) => {
    const parsed = createGenerationSchema.safeParse(ctx.json());
    if (!parsed.success) {
      throw validationError('Invalid generation request', z.flattenError(parsed.error));
    }
    const row = await createGeneration(ctx.apiKey!.id, parsed.data);
    return { data: toGenerationDto(row), status: row.status === 'succeeded' ? 200 : 202 };
  },
  { scope: 'write', idempotent: true },
);

export const GET = withApi(
  async (_req, ctx) => {
    const limit = parseLimit(ctx.searchParams);
    const sort = parseSort(ctx.searchParams);
    const filters = parseFilters(ctx.searchParams);
    const cursor = ctx.searchParams.get('cursor');
    const { rows, nextCursor, hasMore } = await listGenerations(ctx.apiKey!.id, {
      limit,
      sort,
      cursor,
      filters,
    });
    return {
      data: rows.map(toGenerationDto),
      pagination: { limit, next_cursor: nextCursor, has_more: hasMore },
    };
  },
  { scope: 'read' },
);
