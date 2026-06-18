/**
 * Next.js instrumentation hook — runs once when the Node server boots.
 * Schedules the daily retention cleanup (media + ephemeral DB rows) via
 * node-cron. Guarded to the Node.js runtime and against double registration.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const g = globalThis as typeof globalThis & { __cleanupScheduled?: boolean };
  if (g.__cleanupScheduled) return;
  g.__cleanupScheduled = true;

  const cron = (await import('node-cron')).default;
  const { runCleanup } = await import('@/lib/api/cleanup');

  const expr = process.env.CLEANUP_CRON ?? '0 3 * * *'; // daily at 03:00
  cron.schedule(expr, () => {
    runCleanup().catch((e) =>
      console.error('[cleanup] scheduled run failed:', e instanceof Error ? e.message : e),
    );
  });
  console.log(`[cleanup] scheduled with cron "${expr}" (retention ${process.env.CLEANUP_RETENTION_DAYS ?? 3}d)`);
}
