import { describe, it, expect, vi } from 'vitest';
import { makeRequest, expectError, expectSuccess, READ_KEY, WRITE_KEY, BAD_KEY } from './_helpers';

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

describe('authentication & scopes', () => {
  it('returns 401 when the API key is missing', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta'));
    expect(res.status).toBe(401);
    expectError(await res.json(), 'unauthorized');
  });

  it('returns 401 for an invalid API key', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: BAD_KEY }));
    expect(res.status).toBe(401);
    expectError(await res.json(), 'unauthorized');
  });

  it('passes with a valid API key', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: READ_KEY }));
    expect(res.status).toBe(200);
    expectSuccess(await res.json());
  });

  it('returns 403 when the key lacks the required scope', async () => {
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: READ_KEY,
        body: { provider: 'seedance', image_url: 'https://example.com/a.jpg' },
      }),
    );
    expect(res.status).toBe(403);
    expectError(await res.json(), 'forbidden');
  });

  it('allows a write-scoped key past the scope gate', async () => {
    // No dispatch mock here: a write key clears the scope gate, so failure (if any)
    // would be downstream — we only assert it is NOT a 403.
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: WRITE_KEY,
        body: { provider: 'gpt-image', mode: 'image-to-image', prompt: 'x' }, // invalid → 422, not 403
      }),
    );
    expect(res.status).not.toBe(403);
    expect(res.status).toBe(422);
  });
});
