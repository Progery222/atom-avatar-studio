import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

/**
 * Lazy libSQL (SQLite) connection + Drizzle ORM for the external API metadata
 * store (api keys, idempotency records, generation jobs).
 *
 * DATABASE_URL examples:
 *   dev:  file:./.data/app.db
 *   prod: file:/data/atom-api/app.db  (mounted Docker volume)
 *
 * Migrations from ./drizzle are applied once on first access so a fresh
 * deployment self-initialises its schema without a separate migration step.
 */

export type Db = LibSQLDatabase<typeof schema>;

let _client: Client | null = null;
let _db: Db | null = null;
let _migration: Promise<void> | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

function ensureFileDir(url: string): void {
  // For local file DBs, make sure the parent directory exists before opening.
  const match = /^file:(.*)$/.exec(url);
  if (!match) {
    return;
  }
  const filePath = match[1].replace(/^\/\//, '');
  if (!filePath || filePath.startsWith(':')) {
    return; // e.g. file::memory:
  }
  try {
    mkdirSync(dirname(filePath), { recursive: true });
  } catch {
    // directory may already exist or be a managed mount
  }
}

function buildDb(): Db {
  if (!_db) {
    const url = databaseUrl();
    ensureFileDir(url);
    _client = createClient({ url });
    _db = drizzle(_client, { schema });
  }
  return _db;
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
  return db;
}

/** Drizzle handle without the migration gate — only for the migrate script/tests. */
export function getRawDb(): Db {
  return buildDb();
}
