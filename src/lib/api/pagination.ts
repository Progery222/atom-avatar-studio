import { badRequest } from './envelope';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

export type SortDirection = 'asc' | 'desc';

/** limit defaults to 50 and is clamped to [1, 100] (invalid values fall back). */
export function parseLimit(searchParams: URLSearchParams): number {
  const raw = searchParams.get('limit');
  if (!raw) {
    return DEFAULT_LIMIT;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(n), MAX_LIMIT);
}

/** Accepts `created_at` (asc) or `-created_at` (desc); anything else is a 400. */
export function parseSort(searchParams: URLSearchParams, field = 'created_at'): SortDirection {
  const raw = searchParams.get('sort');
  if (!raw) {
    return 'desc';
  }
  if (raw === field) {
    return 'asc';
  }
  if (raw === `-${field}`) {
    return 'desc';
  }
  throw badRequest(`Unsupported sort "${raw}". Use "${field}" or "-${field}".`);
}

/** Collects `filter_<field>` query params into a map. */
export function parseFilters(searchParams: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_') && value) {
      filters[key.slice('filter_'.length)] = value;
    }
  }
  return filters;
}

export interface Cursor {
  createdAt: number;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.createdAt}:${cursor.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) {
    return null;
  }
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw badRequest('Invalid cursor');
  }
  const sep = decoded.indexOf(':');
  if (sep <= 0) {
    throw badRequest('Invalid cursor');
  }
  const createdAt = Number(decoded.slice(0, sep));
  const id = decoded.slice(sep + 1);
  if (!Number.isFinite(createdAt) || !id) {
    throw badRequest('Invalid cursor');
  }
  return { createdAt, id };
}
