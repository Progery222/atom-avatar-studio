import { NextRequest, NextResponse } from 'next/server'
import { HEYGEN_ERROR_MESSAGES } from '@/constants/heygen'
import { createVideo } from '@/lib/heygen'
import type { HeyGenBackground, HeyGenCreateVideoFromImage, HeyGenCreateVideoFromAvatar, HeyGenCreateVideoRequest } from '@/types/heygen'

interface HeyGenGenerateRequestBody {
  sourceType?: 'image' | 'avatar'
  imageUrl?: string
  avatarId?: string
  script?: string
  voiceId?: string
  audioUrl?: string
  resolution?: '720p' | '1080p' | '4k'
  aspectRatio?: '16:9' | '9:16'
  removeBackground?: boolean
  background?: HeyGenBackground
  voiceSettings?: HeyGenCreateVideoFromImage['voice_settings']
  motionPrompt?: string
  expressiveness?: 'high' | 'medium' | 'low'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HeyGenGenerateRequestBody
    const {
      sourceType,
      imageUrl,
      avatarId,
      script,
      voiceId,
      audioUrl,
      resolution,
      aspectRatio,
      removeBackground,
      background,
      voiceSettings,
      motionPrompt,
      expressiveness,
    } = body

    const isImageMode = sourceType !== 'avatar'

    // Validation based on source type
    if (isImageMode) {
      if (!imageUrl) {
        return NextResponse.json({ success: false, error: 'Загрузите изображение' }, { status: 200 })
      }
    } else {
      if (!avatarId) {
        return NextResponse.json({ success: false, error: 'Укажите ID аватара из HeyGen' }, { status: 200 })
      }
    }

    if (script && !voiceId) {
      return NextResponse.json({ success: false, error: 'Выберите голос для озвучки текста' }, { status: 200 })
    }

    if (!script && !audioUrl) {
      return NextResponse.json({ success: false, error: 'Укажите текст для озвучки или загрузите аудиофайл' }, { status: 200 })
    }

    // Build payload based on source type
    if (isImageMode) {
      // Image-to-Video mode
      const payload: HeyGenCreateVideoFromImage = {
        type: 'image',
        image: { type: 'url', url: imageUrl! },
        title: `Aura Dynamics - ${new Date().toISOString()}`,
      }

      if (script && voiceId) {
        payload.script = script
        payload.voice_id = voiceId
      } else if (audioUrl) {
        payload.audio_url = audioUrl
      }

      if (resolution) payload.resolution = resolution
      if (aspectRatio) payload.aspect_ratio = aspectRatio
      if (removeBackground !== undefined) payload.remove_background = removeBackground
      if (background) payload.background = background
      if (voiceSettings) payload.voice_settings = voiceSettings
      // Image-to-Video does NOT support motion_prompt or expressiveness

      console.log('[HeyGen] Image-to-Video payload:', JSON.stringify({
        type: payload.type,
        imageType: payload.image.type,
        hasScript: !!payload.script,
        hasVoiceId: !!payload.voice_id,
        hasAudioUrl: !!payload.audio_url,
        resolution: payload.resolution,
        aspectRatio: payload.aspect_ratio,
        removeBackground: payload.remove_background,
        hasBackground: !!payload.background,
        hasVoiceSettings: !!payload.voice_settings,
      }))

      const result = await createVideo(payload)
      return NextResponse.json({ success: true, videoId: result.data.video_id })

    } else {
      // Photo Avatar mode
      const payload: HeyGenCreateVideoFromAvatar = {
        type: 'avatar',
        avatar_id: avatarId!,
        title: `Aura Dynamics - ${new Date().toISOString()}`,
        // Photo Avatar supports motion_prompt and expressiveness
        expressiveness: expressiveness ?? 'low',
      }

      if (script && voiceId) {
        payload.script = script
        payload.voice_id = voiceId
      } else if (audioUrl) {
        payload.audio_url = audioUrl
      }

      if (resolution) payload.resolution = resolution
      if (aspectRatio) payload.aspect_ratio = aspectRatio
      if (voiceSettings) payload.voice_settings = voiceSettings
      if (motionPrompt) payload.motion_prompt = motionPrompt

      console.log('[HeyGen] Photo Avatar payload:', JSON.stringify({
        type: payload.type,
        avatarId: payload.avatar_id,
        hasScript: !!payload.script,
        hasVoiceId: !!payload.voice_id,
        hasAudioUrl: !!payload.audio_url,
        resolution: payload.resolution,
        aspectRatio: payload.aspect_ratio,
        expressiveness: payload.expressiveness,
        motionPrompt: payload.motion_prompt ?? '(none)',
      }))

      const result = await createVideo(payload as HeyGenCreateVideoRequest)
      return NextResponse.json({ success: true, videoId: result.data.video_id })
    }
  } catch (error) {
    const err = error as Error & { code?: string }
    const code = err.code ?? 'internal_error'
    const message = HEYGEN_ERROR_MESSAGES[code] ?? err.message ?? 'Ошибка создания видео'

    console.error('[HeyGen] Create video error:', JSON.stringify({ code, message }))

    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
