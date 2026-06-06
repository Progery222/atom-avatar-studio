import { describe, it, expect, vi } from 'vitest';
import { makeRequest, expectSuccess, expectError, READ_KEY } from './_helpers';

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

describe('response envelope', () => {
  it('every success response has success + data + meta', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: READ_KEY }));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect('data' in json).toBe(true);
    expectSuccess(json);
  });

  it('every error response has success + error + meta', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta')); // no key → 401
    const json = await res.json();
    expect(json.success).toBe(false);
    expect('error' in json).toBe(true);
    expectError(json);
  });

  it('echoes a client-provided X-Request-Id into meta', async () => {
    const { GET } = await import('@/app/api/v1/health/route');
    const res = await GET(
      makeRequest('GET', '/api/v1/health', { headers: { 'X-Request-Id': 'req_custom_123' } }),
    );
    const json = await res.json();
    expect(json.meta.request_id).toBe('req_custom_123');
    expect(res.headers.get('X-Request-Id')).toBe('req_custom_123');
  });
});
