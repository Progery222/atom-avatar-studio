import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest, expectSuccess, READ_KEY } from './_helpers';
import type { GenerationRow } from '@/lib/api/schema';
import { listGenerations } from '@/lib/api/generation-dispatch';

vi.mock('@/lib/api/auth', () => ({
  authenticate: vi.fn(async (raw: string) => {
    if (raw.includes('bad') || !raw.startsWith('atom_live_')) {
      const { unauthorized } = await import('@/lib/api/envelope');
      throw unauthorized();
    }
    const scopes = raw.includes('admin') ? ['admin'] : raw.includes('write') ? ['read', 'write'] : ['read'];
    return { id: `key_${scopes.join('_')}`, name: 'test', scopes, expiresAt: null };
  }),
  hasScope: (key: { scopes: string[] }, scope: string) =>
    key.scopes.includes('admin') || key.scopes.includes(scope),
  touchLastUsed: () => {},
}));

vi.mock('@/lib/api/generation-dispatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/generation-dispatch')>();
  return { ...actual, listGenerations: vi.fn() };
});

function fakeRow(id: string): GenerationRow {
  const now = new Date('2026-06-05T00:00:00.000Z');
  return {
    id,
    apiKeyId: 'key_read',
    kind: 'video',
    provider: 'seedance',
    model: 'bytedance/seedance-2-fast',
    status: 'succeeded',
    providerTaskId: null,
    inputJson: {},
    resultJson: null,
    errorJson: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('GET /api/v1/generations (cursor pagination)', () => {
  beforeEach(() => {
    vi.mocked(listGenerations).mockReset();
  });

  it('returns a page with pagination meta and a next_cursor', async () => {
    vi.mocked(listGenerations).mockResolvedValue({
      rows: [fakeRow('gen_2'), fakeRow('gen_1')],
      nextCursor: 'CURSOR_2',
      hasMore: true,
    });
    const { GET } = await import('@/app/api/v1/generations/route');
    const res = await GET(makeRequest('GET', '/api/v1/generations?limit=2', { apiKey: READ_KEY }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data).toHaveLength(2);
    expect(json.meta.pagination).toEqual({ limit: 2, next_cursor: 'CURSOR_2', has_more: true });
  });

  it('clamps limit to 100 and forwards cursor/sort/filters', async () => {
    vi.mocked(listGenerations).mockResolvedValue({ rows: [], nextCursor: null, hasMore: false });
    const { GET } = await import('@/app/api/v1/generations/route');
    await GET(
      makeRequest('GET', '/api/v1/generations?limit=500&cursor=CURSOR_2&sort=created_at&filter_status=succeeded', {
        apiKey: READ_KEY,
      }),
    );
    expect(vi.mocked(listGenerations)).toHaveBeenCalledWith('key_read', {
      limit: 100,
      sort: 'asc',
      cursor: 'CURSOR_2',
      filters: { status: 'succeeded' },
    });
  });
});
