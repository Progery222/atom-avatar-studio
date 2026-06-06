/**
 * API key management CLI for the external API.
 *
 *   Dev:  npx tsx scripts/apikey.ts <command> [flags]
 *   Prod: docker exec atom-avatar-app node scripts/apikey.js <command> [flags]
 *
 * Commands:
 *   create  --name <name> [--scopes read,write] [--expires-days N]
 *   list
 *   revoke  --id <key_id>
 *   bootstrap   (creates an admin key only if none exist yet)
 *
 * Requires DATABASE_URL and EXTERNAL_API_KEY_HASH_SECRET in the environment.
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../src/lib/api/db';
import { apiKeys, type ApiScope } from '../src/lib/api/schema';
import { generateRawKey, hashKey, newId, parseScopes } from '../src/lib/api/keys';

function loadEnvFiles(): void {
  const proc = process as NodeJS.Process & { loadEnvFile?: (path?: string) => void };
  if (typeof proc.loadEnvFile !== 'function') {
    return;
  }
  for (const file of ['.env', '.env.local']) {
    try {
      proc.loadEnvFile(file);
    } catch {
      // file absent — env may already be provided by the container
    }
  }
}

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

function printKey(raw: string, id: string, prefix: string): void {
  console.log('\nAPI key created — store it now, it cannot be retrieved again:\n');
  console.log(`  id:     ${id}`);
  console.log(`  prefix: ${prefix}`);
  console.log(`  KEY:    ${raw}\n`);
}

async function insertKey(name: string, scopes: ApiScope[], expiresAt: Date | null): Promise<void> {
  const db = await getDb();
  const { raw, keyPrefix } = generateRawKey();
  const id = newId('key');
  await db.insert(apiKeys).values({
    id,
    name,
    keyPrefix,
    keyHash: hashKey(raw),
    scopes,
    status: 'active',
    expiresAt,
  });
  printKey(raw, id, keyPrefix);
}

async function cmdCreate(args: string[]): Promise<void> {
  const name = getFlag(args, 'name');
  if (!name) {
    throw new Error('--name is required');
  }
  const scopes = parseScopes(getFlag(args, 'scopes') ?? 'read,write');
  const expiresDays = getFlag(args, 'expires-days');
  const expiresAt = expiresDays
    ? new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
    : null;
  await insertKey(name, scopes, expiresAt);
}

async function cmdList(): Promise<void> {
  const db = await getDb();
  const rows = await db.select().from(apiKeys);
  if (rows.length === 0) {
    console.log('No API keys.');
    return;
  }
  for (const r of rows) {
    console.log(
      [
        r.id,
        r.status.padEnd(8),
        r.keyPrefix,
        `[${r.scopes.join(',')}]`,
        r.name,
        `created=${r.createdAt.toISOString()}`,
        `lastUsed=${r.lastUsedAt ? r.lastUsedAt.toISOString() : '-'}`,
        `expires=${r.expiresAt ? r.expiresAt.toISOString() : 'never'}`,
      ].join('  '),
    );
  }
}

async function cmdRevoke(args: string[]): Promise<void> {
  const id = getFlag(args, 'id');
  if (!id) {
    throw new Error('--id is required');
  }
  const db = await getDb();
  await db.update(apiKeys).set({ status: 'revoked' }).where(eq(apiKeys.id, id));
  console.log(`Revoked ${id}`);
}

async function cmdBootstrap(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: apiKeys.id }).from(apiKeys).limit(1);
  if (existing.length > 0) {
    console.log('API keys already exist — bootstrap skipped.');
    return;
  }
  await insertKey('bootstrap', ['read', 'write', 'admin'], null);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'create':
      await cmdCreate(args);
      break;
    case 'list':
      await cmdList();
      break;
    case 'revoke':
      await cmdRevoke(args);
      break;
    case 'bootstrap':
      await cmdBootstrap();
      break;
    default:
      console.log('Usage: apikey <create|list|revoke|bootstrap> [flags]');
      process.exitCode = 1;
  }
}

main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
