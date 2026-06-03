import { NextResponse } from 'next/server';
import { generateTTS, TTSProvider, GeminiTTSOptions, GeminiFlashTTSOptions, TTSResult } from '@/lib/tts';
import { putObject } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    console.error('[TTS API] Request received');
    const { provider, text, voiceId, geminiOptions } = await req.json();

    if (!text || !provider) {
      return NextResponse.json({ success: false, error: 'Provider and text are required' }, { status: 400 });
    }

    // 1. Generate audio
    console.error('[TTS API] Generating TTS, provider:', provider);
    const result: TTSResult = await generateTTS(
      provider as TTSProvider,
      text,
      voiceId,
      geminiOptions as GeminiTTSOptions | GeminiFlashTTSOptions
    );
    console.error('[TTS API] TTS generated, mimeType:', result.mimeType, 'size:', result.buffer.length);
    
    // 2. Upload to storage
    const ext = result.mimeType === 'audio/wav' ? 'wav' : 'mp3';
    const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    console.error('[TTS API] Uploading to storage...');
    const audioUrl = await putObject(filename, Buffer.from(result.buffer), result.mimeType);
    console.error('[TTS API] Upload complete:', audioUrl);

    return NextResponse.json({ success: true, audioUrl });
  } catch (error: any) {
    console.error("[TTS API] Error:", error?.message || error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
