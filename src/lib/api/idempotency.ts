import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb } from './db';
import { idempotencyKeys } from './schema';
import { newId } from './keys';

/**
 * Idempotency for mutating requests carrying an `Idempotency-Key` header.
 * A first request inserts an in-progress row; duplicates either replay the
 * stored response, signal an in-flight conflict, or flag a body mismatch.
 */

const TTL_MS = 24 * 60 * 60 * 1000;

export function requestHash(method: string, path: string, rawBody: string): string {
  return createHash('sha256').update(`${method}\n${path}\n${rawBody}`).digest('hex');
}

export type BeginOutcome =
  | { type: 'fresh'; id: string }
  | { type: 'replay'; statusCode: number; body: unknown }
  | { type: 'in_progress' }
  | { type: 'mismatch' };

export async function begin(
  apiKeyId: string,
  key: string,
  method: string,
  path: string,
  rawBody: string,
): Promise<BeginOutcome> {
  const db = await getDb();
  const now = Date.now();
  const hash = requestHash(method, path, rawBody);

  try {
    const id = newId('idem');
    await db.insert(idempotencyKeys).values({
      id,
      key,
      apiKeyId,
      method,
      path,
      requestHash: hash,
      status: 'in_progress',
      expiresAt: new Date(now + TTL_MS),
    });
    return { type: 'fresh', id };
  } catch {
    // Unique (api_key_id, key) conflict — inspect the existing row.
    const rows = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.apiKeyId, apiKeyId), eq(idempotencyKeys.key, key)))
      .limit(1);
    const row = rows[0];
    if (!row) {
      // Lost a race and the row vanished — let the caller proceed fresh.
      const id = newId('idem');
      await db.insert(idempotencyKeys).values({
        id,
        key,
        apiKeyId,
        method,
        path,
        requestHash: hash,
        status: 'in_progress',
        expiresAt: new Date(now + TTL_MS),
      });
      return { type: 'fresh', id };
    }

    if (row.expiresAt.getTime() < now) {
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.id, row.id));
      const id = newId('idem');
      await db.insert(idempotencyKeys).values({
        id,
        key,
        apiKeyId,
        method,
        path,
        requestHash: hash,
        status: 'in_progress',
        expiresAt: new Date(now + TTL_MS),
      });
      return { type: 'fresh', id };
    }

    if (row.requestHash !== hash) {
      return { type: 'mismatch' };
    }
    if (row.status === 'completed') {
      return { type: 'replay', statusCode: row.statusCode ?? 200, body: row.responseJson };
    }
    return { type: 'in_progress' };
  }
}

export async function complete(id: string, statusCode: number, body: unknown): Promise<void> {
  const db = await getDb();
  await db
    .update(idempotencyKeys)
    .set({ status: 'completed', statusCode, responseJson: body })
    .where(eq(idempotencyKeys.id, id));
}

export async function fail(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(idempotencyKeys).where(eq(idempotencyKeys.id, id));
}
