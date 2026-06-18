import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';
import { apiKeys } from './schema';
import { prefixOf, hashKey, newId } from './keys';

/**
 * Lazy PostgreSQL connection + Drizzle ORM for the external API metadata
 * store (api keys, idempotency records, generation jobs). Self-hosted Postgres
 * (e.g. the `postgres` service in docker-compose), no managed provider.
 *
 * DATABASE_URL examples:
 *   dev:  postgresql://atom:password@localhost:5432/atom_api
 *   prod: postgresql://atom:password@postgres:5432/atom_api  (compose service)
 *
 * Migrations from ./drizzle are applied once on first access so a fresh
 * deployment self-initialises its schema without a separate migration step.
 */

export type Db = NodePgDatabase<typeof schema>;

let _pool: Pool | null = null;
let _db: Db | null = null;
let _migration: Promise<void> | null = null;
let _bootstrapped = false;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

function buildDb(): Db {
  if (!_db) {
    _pool = new Pool({ connectionString: databaseUrl() });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/**
 * Seeds an initial API key from EXTERNAL_API_BOOTSTRAP_KEY (the raw key) if the
 * table is empty — the provisioning path for containerized deployments where the
 * apikey CLI is not available. Runs at most once per process; no-op otherwise.
 */
async function ensureBootstrap(db: Db): Promise<void> {
  if (_bootstrapped) {
    return;
  }
  const raw = process.env.EXTERNAL_API_BOOTSTRAP_KEY?.trim();
  if (!raw) {
    _bootstrapped = true;
    return;
  }
  try {
    const prefix = prefixOf(raw);
    if (!prefix) {
      _bootstrapped = true;
      return;
    }
    const existing = await db.select({ id: apiKeys.id }).from(apiKeys).limit(1);
    if (existing.length === 0) {
      await db.insert(apiKeys).values({
        id: newId('key'),
        name: 'bootstrap',
        keyPrefix: prefix,
        keyHash: hashKey(raw),
        scopes: ['read', 'write', 'admin'],
        status: 'active',
        expiresAt: null,
      });
    }
    _bootstrapped = true;
  } catch {
    // Leave _bootstrapped false so a later request retries (e.g. missing pepper).
  }
}

/** Returns a ready-to-use Drizzle handle, applying pending migrations once. */
export async function getDb(): Promise<Db> {
  const db = buildDb();
  if (!_migration) {
    _migration = migrate(db, { migrationsFolder: 'drizzle' }).catch((err) => {
      // Reset so a later request can retry migration instead of being stuck.
      _migration = null;
      throw err;
    });
  }
  await _migration;
  await ensureBootstrap(db);
  return db;
}

/** Drizzle handle without the migration gate — only for the migrate script/tests. */
export function getRawDb(): Db {
  return buildDb();
}
