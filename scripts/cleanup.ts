/**
 * Manual retention cleanup runner (also scheduled in-app via instrumentation).
 *
 *   Dev:  npx tsx scripts/cleanup.ts
 *   Prod: docker exec atom-avatar-app node scripts/cleanup.js
 *
 * Deletes media objects + ephemeral DB rows older than CLEANUP_RETENTION_DAYS
 * (default 3). Requires DATABASE_URL and S3_* in the environment.
 */
import { runCleanup } from '../src/lib/api/cleanup';

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

async function main(): Promise<void> {
  loadEnvFiles();
  const result = await runCleanup();
  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
