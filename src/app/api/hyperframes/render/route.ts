import { NextResponse } from 'next/server';
import { renderComposition } from '@/lib/hyperframes/renderer';
import type { RenderSettings } from '@/types/hyperframes';

interface RenderRequestBody {
  compositionHtml: string;
  settings: RenderSettings;
  duration?: number;
}

const VALID_FORMATS: RenderSettings['format'][] = ['mp4', 'webm'];
const VALID_RESOLUTIONS: RenderSettings['resolution'][] = ['480p', '720p', '1080p'];
const VALID_FPS: RenderSettings['fps'][] = [24, 30, 60];
const VALID_QUALITY: RenderSettings['quality'][] = ['low', 'medium', 'high'];
const VALID_CODECS: RenderSettings['codec'][] = ['h264', 'h265', 'vp9'];

export async function POST(req: Request) {
  try {
    const body: RenderRequestBody = await req.json();

    const { compositionHtml, settings, duration } = body;

    if (!compositionHtml || typeof compositionHtml !== 'string') {
      return NextResponse.json(
        { success: false, error: 'compositionHtml is required and must be a string' },
        { status: 400 },
      );
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'settings is required' },
        { status: 400 },
      );
    }

    if (!VALID_FORMATS.includes(settings.format)) {
      return NextResponse.json(
        { success: false, error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_RESOLUTIONS.includes(settings.resolution)) {
      return NextResponse.json(
        { success: false, error: `Invalid resolution. Must be one of: ${VALID_RESOLUTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_FPS.includes(settings.fps)) {
      return NextResponse.json(
        { success: false, error: `Invalid fps. Must be one of: ${VALID_FPS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_QUALITY.includes(settings.quality)) {
      return NextResponse.json(
        { success: false, error: `Invalid quality. Must be one of: ${VALID_QUALITY.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_CODECS.includes(settings.codec)) {
      return NextResponse.json(
        { success: false, error: `Invalid codec. Must be one of: ${VALID_CODECS.join(', ')}` },
        { status: 400 },
      );
    }

    const durationSec = typeof duration === 'number' && duration > 0 ? duration : 10;

    const result = await renderComposition(compositionHtml, settings, durationSec);

    return NextResponse.json({ success: true, data: { jobId: result.jobId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown render error';
    console.error('[Hyperframes Render API Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
