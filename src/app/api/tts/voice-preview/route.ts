import { NextResponse } from 'next/server';
import { generateGeminiFlashTTS } from '@/lib/tts';
import { getPreviewText } from '@/constants/gemini-flash-tts';

export async function POST(req: Request) {
  try {
    const { voiceName, languageCode } = await req.json();

    if (!voiceName || typeof voiceName !== 'string') {
      return NextResponse.json({ success: false, error: 'voiceName is required' }, { status: 400 });
    }

    const previewText = getPreviewText(languageCode || 'en-US', voiceName);

    const result = await generateGeminiFlashTTS(previewText, {
      voiceName,
      languageCode,
    });

    const arrayBuffer = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Length': String(arrayBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error('[Voice Preview API] Error:', error?.message || error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
