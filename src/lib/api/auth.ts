import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { apiKeys, type ApiKeyRow, type ApiScope } from './schema';
import { prefixOf, hashKey, safeEqualHex } from './keys';
import { unauthorized } from './envelope';

export interface AuthedKey {
  id: string;
  name: string;
  scopes: ApiScope[];
  expiresAt: Date | null;
}

function toAuthed(row: ApiKeyRow): AuthedKey {
  return { id: row.id, name: row.name, scopes: row.scopes, expiresAt: row.expiresAt };
}

/**
 * Validates a raw X-API-Key. Throws `unauthorized` for any failure (missing,
 * malformed, unknown, revoked, expired, hash mismatch) without leaking which.
 */
export async function authenticate(rawKey: string): Promise<AuthedKey> {
  const prefix = prefixOf(rawKey);
  if (!prefix) {
    throw unauthorized();
  }

  const db = await getDb();
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyPrefix, prefix)).limit(1);
  const row = rows[0];
  if (!row) {
    throw unauthorized();
  }

  if (!safeEqualHex(row.keyHash, hashKey(rawKey))) {
    throw unauthorized();
  }

  if (row.status === 'revoked') {
    throw unauthorized();
  }

  const now = Date.now();
  if (row.expiresAt && row.expiresAt.getTime() < now) {
    if (row.status !== 'expired') {
      await db.update(apiKeys).set({ status: 'expired' }).where(eq(apiKeys.id, row.id));
    }
    throw unauthorized();
  }

  if (row.status === 'expired') {
    throw unauthorized();
  }

  return toAuthed(row);
}

/** `admin` implies every scope; otherwise the exact scope must be present. */
export function hasScope(key: AuthedKey, scope: ApiScope): boolean {
  return key.scopes.includes('admin') || key.scopes.includes(scope);
}

/** Best-effort, off the response critical path — never blocks the request. */
export function touchLastUsed(keyId: string): void {
  void (async () => {
    try {
      const db = await getDb();
      await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
    } catch {
      // last_used_at is advisory; swallow failures.
    }
  })();
}
