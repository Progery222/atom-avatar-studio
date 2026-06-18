import { lt } from 'drizzle-orm';
import { getDb } from './db';
import { generations, idempotencyKeys } from './schema';
import { listObjects, removeObjects } from '../storage';

/**
 * Retention cleanup for transient media + ephemeral DB rows.
 *
 * The MinIO `media` bucket is working storage only (user uploads + generated
 * TTS audio) — every object is safe to expire by age. Provider-hosted videos
 * and images live behind external URLs and are not ours to delete.
 *
 * Deletes:
 *   - every storage object older than CLEANUP_RETENTION_DAYS (default 3)
 *   - `generations` rows older than the same cutoff
 *   - expired `idempotency_keys` rows
 *
 * Each step is isolated so one failure does not abort the rest.
 */

export interface CleanupResult {
  files: number;
  generations: number;
  idempotency: number;
}

function retentionDays(): number {
  const n = Number(process.env.CLEANUP_RETENTION_DAYS);
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

export async function runCleanup(): Promise<CleanupResult> {
  const now = Date.now();
  const cutoff = new Date(now - retentionDays() * 24 * 60 * 60 * 1000);
  const result: CleanupResult = { files: 0, generations: 0, idempotency: 0 };

  // ── Storage objects older than the cutoff ──
  try {
    const objects = await listObjects();
    const stale = objects.filter((o) => o.lastModified.getTime() < cutoff.getTime()).map((o) => o.key);
    await removeObjects(stale);
    result.files = stale.length;
  } catch (e) {
    console.error('[cleanup] storage sweep failed:', e instanceof Error ? e.message : e);
  }

  // ── Old generation rows ──
  try {
    const db = await getDb();
    const deleted = await db.delete(generations).where(lt(generations.createdAt, cutoff)).returning({ id: generations.id });
    result.generations = deleted.length;
  } catch (e) {
    console.error('[cleanup] generations sweep failed:', e instanceof Error ? e.message : e);
  }

  // ── Expired idempotency rows ──
  try {
    const db = await getDb();
    const deleted = await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, new Date(now)))
      .returning({ id: idempotencyKeys.id });
    result.idempotency = deleted.length;
  } catch (e) {
    console.error('[cleanup] idempotency sweep failed:', e instanceof Error ? e.message : e);
  }

  console.log(
    `[cleanup] removed ${result.files} file(s), ${result.generations} generation row(s), ${result.idempotency} idempotency row(s) (retention ${retentionDays()}d)`,
  );
  return result;
}
