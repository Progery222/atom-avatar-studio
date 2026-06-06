import { expect } from 'vitest';

export const WRITE_KEY = 'atom_live_writekey';
export const READ_KEY = 'atom_live_readkey';
export const ADMIN_KEY = 'atom_live_adminkey';
export const BAD_KEY = 'atom_live_badkey';

interface RequestOptions {
  apiKey?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export function makeRequest(method: string, path: string, opts: RequestOptions = {}): Request {
  const headers: Record<string, string> = { Accept: 'application/json', ...(opts.headers ?? {}) };
  if (opts.apiKey) {
    headers['X-API-Key'] = opts.apiKey;
  }
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  return new Request(`http://localhost${path}`, { method, headers, body });
}

/** Context object Next.js passes as the 2nd arg to dynamic route handlers. */
export function routeCtx(params: Record<string, string>): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve(params) };
}

type Json = Record<string, unknown> & { meta?: Record<string, unknown>; error?: Record<string, unknown> };

export function expectMeta(json: Json): void {
  expect(json.meta).toBeDefined();
  expect(typeof json.meta!.request_id).toBe('string');
  expect(json.meta!.service).toBe('atom-avatar-studio');
  expect(json.meta!.api_version).toBe('v1');
}

export function expectSuccess(json: Json): void {
  expect(json.success).toBe(true);
  expect('data' in json).toBe(true);
  expectMeta(json);
}

export function expectError(json: Json, code?: string): void {
  expect(json.success).toBe(false);
  expect(json.error).toBeDefined();
  expect(typeof json.error!.code).toBe('string');
  expect(typeof json.error!.message).toBe('string');
  if (code) {
    expect(json.error!.code).toBe(code);
  }
  expectMeta(json);
}
