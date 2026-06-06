import { randomBytes, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import type { ApiScope } from './schema';

/**
 * API key primitives. Raw keys are high-entropy random tokens; only an
 * HMAC-SHA256 hash (peppered with EXTERNAL_API_KEY_HASH_SECRET) is persisted.
 * The raw key is shown exactly once at creation and never logged.
 */

const KEY_LABEL = 'atom_live_';
const PREFIX_VISIBLE = 6; // chars of the random part kept in the stored prefix
const RANDOM_BYTES = 32; // 256 bits of entropy

export const ALL_SCOPES: ApiScope[] = ['read', 'write', 'admin'];

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

export interface GeneratedKey {
  raw: string;
  keyPrefix: string;
}

export function generateRawKey(): GeneratedKey {
  const random = randomBytes(RANDOM_BYTES).toString('base64url');
  const raw = `${KEY_LABEL}${random}`;
  const keyPrefix = `${KEY_LABEL}${random.slice(0, PREFIX_VISIBLE)}`;
  return { raw, keyPrefix };
}

/** Derive the stored lookup prefix from a raw key (label + first N random chars). */
export function prefixOf(raw: string): string | null {
  if (!raw.startsWith(KEY_LABEL)) {
    return null;
  }
  const random = raw.slice(KEY_LABEL.length);
  if (random.length < PREFIX_VISIBLE) {
    return null;
  }
  return `${KEY_LABEL}${random.slice(0, PREFIX_VISIBLE)}`;
}

function pepper(): string {
  const secret = process.env.EXTERNAL_API_KEY_HASH_SECRET;
  if (!secret) {
    throw new Error('EXTERNAL_API_KEY_HASH_SECRET is not set');
  }
  return secret;
}

export function hashKey(raw: string): string {
  return createHmac('sha256', pepper()).update(raw, 'utf8').digest('hex');
}

/** Constant-time comparison of two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function parseScopes(input: string): ApiScope[] {
  const scopes = input
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const invalid = scopes.filter((s) => !ALL_SCOPES.includes(s as ApiScope));
  if (invalid.length > 0) {
    throw new Error(`Invalid scope(s): ${invalid.join(', ')}. Allowed: ${ALL_SCOPES.join(', ')}`);
  }
  return [...new Set(scopes)] as ApiScope[];
}
