import { NextResponse } from 'next/server';
import { createKieTask, CreateTaskPayload } from '@/lib/kie';
import { PromptParams } from '@/lib/prompt-builder';
import { generateTTS, TTSProvider, GeminiTTSOptions, GeminiFlashTTSOptions } from '@/lib/tts';
import { uploadFileToSupabase } from '@/lib/supabase';
import { AI_MODELS } from '@/constants/models';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { 
      modelId, // New
      imageRefUrl, 
      audioUrl, // For custom uploaded audio
      emotion, 
      dynamism, 
      cameraStyle, 
      spokenText,
      gender,
      duration,
      resolution,
      aspectRatio,
      webSearch,
      nsfwChecker,
      ttsProvider, // New
      voiceId, // New
      geminiOptions,
      cameraEffectPrompt, // New
      lightingId // New
    } = body;

    const selectedModelId = modelId || 'bytedance/seedance-2-fast';
    const selectedModel = AI_MODELS.find(m => m.id === selectedModelId);

    if (!imageRefUrl) {
        return NextResponse.json({ success: false, error: 'imageRefUrl is required' }, { status: 400 });
    }

    let finalAudioUrl = audioUrl;

    // Logic for models that require external audio (like Kling)
    if (selectedModel?.type === 'external-audio') {
      // Case 1: No uploaded audio, but text is provided -> Generate TTS
      if (!finalAudioUrl && spokenText) {
        const audioResult = await generateTTS(
          (ttsProvider as TTSProvider) || 'openai',
          spokenText,
          voiceId,
          geminiOptions as GeminiTTSOptions | GeminiFlashTTSOptions | undefined
        );
        
        // Upload to Supabase to get a public URL for KIE
        const ext = audioResult.mimeType === 'audio/wav' ? 'wav' : 'mp3';
        const fileName = `tts_${Date.now()}.${ext}`;
        const uploadedUrl = await uploadFileToSupabase('media', `audio/${fileName}`, new Blob([audioResult.buffer.slice().buffer]));
        finalAudioUrl = uploadedUrl;
      }
      
      // If we still don't have an audio URL for an external-audio model, it's an error
      if (!finalAudioUrl) {
         return NextResponse.json({ success: false, error: 'Audio is required for this model (either upload or text for TTS)' }, { status: 400 });
      }
    }

    const payload: CreateTaskPayload = {
      modelId: selectedModelId,
      imageRefUrl,
      audioRefUrl: finalAudioUrl,
      spokenText,
      gender,
      duration,
      resolution,
      aspectRatio,
      webSearch,
      nsfwChecker,
      promptParams: {
        emotion: emotion || 'neutral',
        dynamism: Number(dynamism) as PromptParams['dynamism'] || 1,
        cameraStyle: cameraStyle || 'static',
        lightingId: lightingId || 'studio',
        cameraEffectPrompt: cameraEffectPrompt
      }
    };

    const taskResult = await createKieTask(payload);

    return NextResponse.json({ success: true, taskId: taskResult?.taskId });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
