import { randomUUID } from 'crypto';
import type { RenderJob } from '@/types/hyperframes';
import { renderJobs } from './renderer';

export function createJob(compositionId: string): string {
  const jobId = randomUUID();
  const job: RenderJob = {
    id: jobId,
    compositionId,
    status: 'queued',
    progress: 0,
    outputUrl: null,
    error: null,
    startedAt: null,
    completedAt: null,
  };
  renderJobs.set(jobId, job);
  return jobId;
}

export function updateJob(jobId: string, partial: Partial<RenderJob>): void {
  const existing = renderJobs.get(jobId);
  if (!existing) return;
  renderJobs.set(jobId, { ...existing, ...partial });
}

export function getJob(jobId: string): RenderJob | null {
  return renderJobs.get(jobId) ?? null;
}

export function listJobs(): RenderJob[] {
  return Array.from(renderJobs.values());
}
