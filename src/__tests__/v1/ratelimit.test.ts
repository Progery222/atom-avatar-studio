import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRequest, expectError, READ_KEY } from './_helpers';
import { _reset } from '@/lib/api/rate-limit';

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

describe('rate limiting', () => {
  beforeEach(() => {
    _reset();
    vi.stubEnv('EXTERNAL_API_RATE_LIMIT_PER_MINUTE', '1');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    _reset();
  });

  it('returns 429 once the per-key limit is exceeded', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');

    const first = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: READ_KEY }));
    expect(first.status).toBe(200);
    expect(first.headers.get('X-RateLimit-Limit')).toBe('1');

    const second = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: READ_KEY }));
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).toBeTruthy();
    expectError(await second.json(), 'rate_limited');
  });
});
