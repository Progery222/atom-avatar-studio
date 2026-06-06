import { describe, it, expect } from 'vitest';
import { mapKieState, mapHeygenStatus, isTerminal, extractKieVideoResult } from '@/lib/api/generation-mapper';
import { encodeCursor, decodeCursor, parseLimit, parseSort } from '@/lib/api/pagination';
import { ApiError } from '@/lib/api/envelope';

describe('generation-mapper', () => {
  it('maps KIE states to canonical statuses', () => {
    expect(mapKieState('waiting')).toBe('queued');
    expect(mapKieState('queuing')).toBe('queued');
    expect(mapKieState('generating')).toBe('processing');
    expect(mapKieState('success')).toBe('succeeded');
    expect(mapKieState('fail')).toBe('failed');
    expect(mapKieState(undefined)).toBe('processing');
  });

  it('maps HeyGen statuses to canonical statuses', () => {
    expect(mapHeygenStatus('pending')).toBe('queued');
    expect(mapHeygenStatus('processing')).toBe('processing');
    expect(mapHeygenStatus('completed')).toBe('succeeded');
    expect(mapHeygenStatus('failed')).toBe('failed');
  });

  it('detects terminal statuses', () => {
    expect(isTerminal('succeeded')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('canceled')).toBe(true);
    expect(isTerminal('queued')).toBe(false);
    expect(isTerminal('processing')).toBe(false);
  });

  it('extracts a video URL from KIE resultJson', () => {
    expect(extractKieVideoResult(JSON.stringify({ resultUrls: ['https://x/v.mp4'] }))).toEqual({
      video_url: 'https://x/v.mp4',
    });
    expect(extractKieVideoResult(JSON.stringify({ video_url: 'https://x/v.mp4' }))).toEqual({
      video_url: 'https://x/v.mp4',
    });
    expect(extractKieVideoResult(undefined)).toEqual({ video_url: null });
    expect(extractKieVideoResult('not json')).toEqual({ video_url: null });
  });
});

describe('pagination', () => {
  it('round-trips a cursor', () => {
    const cursor = encodeCursor({ createdAt: 1_700_000_000_000, id: 'gen_abc' });
    expect(decodeCursor(cursor)).toEqual({ createdAt: 1_700_000_000_000, id: 'gen_abc' });
  });

  it('clamps limit to [1,100] with default 50', () => {
    expect(parseLimit(new URLSearchParams(''))).toBe(50);
    expect(parseLimit(new URLSearchParams('limit=10'))).toBe(10);
    expect(parseLimit(new URLSearchParams('limit=500'))).toBe(100);
    expect(parseLimit(new URLSearchParams('limit=0'))).toBe(50);
    expect(parseLimit(new URLSearchParams('limit=abc'))).toBe(50);
  });

  it('parses sort direction and rejects unknown', () => {
    expect(parseSort(new URLSearchParams(''))).toBe('desc');
    expect(parseSort(new URLSearchParams('sort=created_at'))).toBe('asc');
    expect(parseSort(new URLSearchParams('sort=-created_at'))).toBe('desc');
    expect(() => parseSort(new URLSearchParams('sort=name'))).toThrow(ApiError);
  });

  it('throws bad_request on a malformed cursor', () => {
    expect(() => decodeCursor('@@@not-base64@@@')).toThrow(ApiError);
  });
});
