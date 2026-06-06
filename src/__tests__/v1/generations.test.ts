import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRequest, routeCtx, expectSuccess, expectError, WRITE_KEY } from './_helpers';
import type { GenerationRow } from '@/lib/api/schema';
import {
  createGeneration,
  getGeneration,
  refreshGeneration,
} from '@/lib/api/generation-dispatch';

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

vi.mock('@/lib/storage', () => ({
  putObject: vi.fn(async () => 'http://minio.local/api/files/uploads/x.png'),
}));

vi.mock('@/lib/api/generation-dispatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/generation-dispatch')>();
  return {
    ...actual,
    createGeneration: vi.fn(),
    getGeneration: vi.fn(),
    refreshGeneration: vi.fn(),
    listGenerations: vi.fn(),
    cancelGeneration: vi.fn(),
  };
});

function row(overrides: Partial<GenerationRow>): GenerationRow {
  const now = new Date('2026-06-05T00:00:00.000Z');
  return {
    id: 'gen_1',
    apiKeyId: 'key_read_write',
    kind: 'video',
    provider: 'seedance',
    model: 'bytedance/seedance-2-fast',
    status: 'queued',
    providerTaskId: 'task_1',
    inputJson: {},
    resultJson: null,
    errorJson: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('POST /api/v1/generations', () => {
  beforeEach(() => {
    vi.mocked(createGeneration).mockReset();
  });

  it('creates an async video generation (202, queued)', async () => {
    vi.mocked(createGeneration).mockResolvedValue(row({ kind: 'video', provider: 'seedance', status: 'queued' }));
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: WRITE_KEY,
        body: { provider: 'seedance', image_url: 'https://example.com/a.jpg', spoken_text: 'hi' },
      }),
    );
    expect(res.status).toBe(202);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data.kind).toBe('video');
    expect(json.data.status).toBe('queued');
  });

  it('creates an async image generation (202)', async () => {
    vi.mocked(createGeneration).mockResolvedValue(
      row({ kind: 'image', provider: 'gpt-image', model: 'gpt-image-2-text-to-image', status: 'queued' }),
    );
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: WRITE_KEY,
        body: { provider: 'gpt-image', mode: 'text-to-image', prompt: 'a cat', resolution: '2K' },
      }),
    );
    expect(res.status).toBe(202);
    expect((await res.json()).data.kind).toBe('image');
  });

  it('creates a synchronous speech generation (200, succeeded + audio_url)', async () => {
    vi.mocked(createGeneration).mockResolvedValue(
      row({
        kind: 'speech',
        provider: 'openai',
        model: 'openai',
        status: 'succeeded',
        providerTaskId: null,
        resultJson: { audio_url: 'http://minio.local/api/files/audio/x.mp3' },
      }),
    );
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: WRITE_KEY,
        body: { provider: 'openai', text: 'Hello world' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('succeeded');
    expect(json.data.result.audio_url).toContain('/audio/');
  });

  it('rejects an invalid request with 422', async () => {
    const { POST } = await import('@/app/api/v1/generations/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/generations', {
        apiKey: WRITE_KEY,
        body: { provider: 'gpt-image', mode: 'image-to-image', prompt: 'x' }, // missing input_urls
      }),
    );
    expect(res.status).toBe(422);
    expectError(await res.json(), 'validation_error');
    expect(vi.mocked(createGeneration)).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/generations/{id}', () => {
  it('polls the provider and returns the refreshed status', async () => {
    vi.mocked(getGeneration).mockResolvedValue(row({ status: 'queued' }));
    vi.mocked(refreshGeneration).mockResolvedValue(
      row({ status: 'succeeded', resultJson: { video_url: 'http://x/v.mp4' } }),
    );
    const { GET } = await import('@/app/api/v1/generations/[id]/route');
    const res = await GET(makeRequest('GET', '/api/v1/generations/gen_1', { apiKey: WRITE_KEY }), routeCtx({ id: 'gen_1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('succeeded');
    expect(json.data.result.video_url).toBe('http://x/v.mp4');
  });

  it('returns 404 for an unknown generation', async () => {
    vi.mocked(getGeneration).mockResolvedValue(null);
    const { GET } = await import('@/app/api/v1/generations/[id]/route');
    const res = await GET(makeRequest('GET', '/api/v1/generations/missing', { apiKey: WRITE_KEY }), routeCtx({ id: 'missing' }));
    expect(res.status).toBe(404);
    expectError(await res.json(), 'not_found');
  });
});

describe('POST /api/v1/actions/upload', () => {
  it('stores a base64 payload and returns its URL', async () => {
    const { POST } = await import('@/app/api/v1/actions/upload/route');
    const res = await POST(
      makeRequest('POST', '/api/v1/actions/upload', {
        apiKey: WRITE_KEY,
        body: {
          source: 'base64',
          data: Buffer.from('hello').toString('base64'),
          content_type: 'image/png',
          kind: 'image',
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expectSuccess(json);
    expect(json.data.url).toContain('/uploads/');
    expect(json.data.content_type).toBe('image/png');
    expect(json.data.bytes).toBe(5);
  });
});
