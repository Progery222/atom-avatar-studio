import type { GenerationStatus } from './schema';

/** KIE task state (Seedance / Kling / GPT-Image) → canonical status. */
export function mapKieState(state: string | undefined): GenerationStatus {
  switch (state) {
    case 'waiting':
    case 'queuing':
      return 'queued';
    case 'generating':
      return 'processing';
    case 'success':
      return 'succeeded';
    case 'fail':
      return 'failed';
    default:
      return 'processing';
  }
}

/** HeyGen video status → canonical status. */
export function mapHeygenStatus(status: string | undefined): GenerationStatus {
  switch (status) {
    case 'pending':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'succeeded';
    case 'failed':
      return 'failed';
    default:
      return 'processing';
  }
}

export function isTerminal(status: GenerationStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'canceled';
}

/** Pulls a video URL out of a KIE recordInfo `resultJson` payload. */
export function extractKieVideoResult(resultJson: string | undefined): { video_url: string | null } {
  if (!resultJson) {
    return { video_url: null };
  }
  try {
    const parsed = JSON.parse(resultJson) as {
      resultUrls?: unknown;
      result_urls?: unknown;
      video_url?: unknown;
    };
    const urls = parsed.resultUrls ?? parsed.result_urls;
    if (Array.isArray(urls) && typeof urls[0] === 'string') {
      return { video_url: urls[0] };
    }
    if (typeof parsed.video_url === 'string') {
      return { video_url: parsed.video_url };
    }
  } catch {
    // ignore malformed result JSON
  }
  return { video_url: null };
}
