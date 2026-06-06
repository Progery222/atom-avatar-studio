import { describe, it, expect, vi } from 'vitest';
import { makeRequest, expectSuccess, READ_KEY } from './_helpers';

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

describe('system endpoints', () => {
  it('GET /health works without a key', async () => {
    const { GET } = await import('@/app/api/v1/health/route');
    const res = await GET(makeRequest('GET', '/api/v1/health'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data.status).toBe('ok');
    expect(typeof json.data.timestamp).toBe('string');
  });

  it('GET /meta returns the service slug + capabilities', async () => {
    const { GET } = await import('@/app/api/v1/meta/route');
    const res = await GET(makeRequest('GET', '/api/v1/meta', { apiKey: READ_KEY }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data.service).toBe('atom-avatar-studio');
    expect(json.data.api_version).toBe('v1');
    expect(Array.isArray(json.data.capabilities)).toBe(true);
    expect(json.data.capabilities.length).toBeGreaterThan(0);
    expect(json.data.documentation_url).toBe('/api/v1/openapi.json');
  });

  it('GET /auth/verify reports the key as valid', async () => {
    const { GET } = await import('@/app/api/v1/auth/verify/route');
    const res = await GET(makeRequest('GET', '/api/v1/auth/verify', { apiKey: READ_KEY }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data.valid).toBe(true);
    expect(typeof json.data.key_id).toBe('string');
    expect(json.data.scopes).toContain('read');
  });

  it('GET /openapi.json returns an OpenAPI document', async () => {
    const { GET } = await import('@/app/api/v1/openapi.json/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.openapi).toBe('string');
    expect(json.openapi.startsWith('3.')).toBe(true);
    expect(json.paths['/generations']).toBeDefined();
    expect(json.components.securitySchemes.ApiKeyAuth).toBeDefined();
  });
});
