import { NextResponse } from 'next/server';
import { generateTTS, TTSProvider, GeminiTTSOptions, GeminiFlashTTSOptions, TTSResult } from '@/lib/tts';
import { uploadFileToSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { provider, text, voiceId, geminiOptions } = await req.json();

    if (!text || !provider) {
      return NextResponse.json({ success: false, error: 'Provider and text are required' }, { status: 400 });
    }

    // 1. Generate audio
    const result: TTSResult = await generateTTS(
      provider as TTSProvider,
      text,
      voiceId,
      geminiOptions as GeminiTTSOptions | GeminiFlashTTSOptions
    );
    
    // 2. Upload to Supabase
    const ext = result.mimeType === 'audio/wav' ? 'wav' : 'mp3';
    const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const blob = new Blob([result.buffer.slice().buffer], { type: result.mimeType });
    
    // Bucket hardcoded to 'media' for now. Make sure 'media' bucket is public.
    const audioUrl = await uploadFileToSupabase('media', filename, blob);

    return NextResponse.json({ success: true, audioUrl });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
