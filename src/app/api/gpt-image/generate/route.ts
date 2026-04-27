import { NextRequest, NextResponse } from 'next/server'
import { createGptImageTask } from '@/lib/gpt-image'
import { GptImageGenerationMode } from '@/types/gpt-image'
import { GPT_IMAGE_LIMITS, GPT_IMAGE_CONSTRAINTS } from '@/constants/gpt-image'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.KIE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'KIE_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { mode, prompt, aspectRatio, resolution, inputUrls } = body

    if (!mode || (mode !== 'text-to-image' && mode !== 'image-to-image')) {
      return NextResponse.json(
        { success: false, error: 'mode is required and must be "text-to-image" or "image-to-image"' },
        { status: 400 }
      )
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (prompt.length > GPT_IMAGE_LIMITS.maxPromptLength) {
      return NextResponse.json(
        { success: false, error: `prompt exceeds maximum length of ${GPT_IMAGE_LIMITS.maxPromptLength} characters` },
        { status: 400 }
      )
    }

    if (mode === 'image-to-image') {
      if (!Array.isArray(inputUrls) || inputUrls.length === 0) {
        return NextResponse.json(
          { success: false, error: 'inputUrls is required for image-to-image mode and must be a non-empty array' },
          { status: 400 }
        )
      }

      if (inputUrls.length > GPT_IMAGE_LIMITS.maxInputUrls) {
        return NextResponse.json(
          { success: false, error: `inputUrls exceeds maximum of ${GPT_IMAGE_LIMITS.maxInputUrls} items` },
          { status: 400 }
        )
      }
    }

    if (
      aspectRatio === GPT_IMAGE_CONSTRAINTS.invalidCombos[0].aspectRatio &&
      resolution === GPT_IMAGE_CONSTRAINTS.invalidCombos[0].resolution
    ) {
      return NextResponse.json(
        { success: false, error: 'Соотношение 1:1 не поддерживает разрешение 4K' },
        { status: 400 }
      )
    }

    if (aspectRatio === 'auto' && resolution !== GPT_IMAGE_CONSTRAINTS.autoResolutionLimit) {
      return NextResponse.json(
        { success: false, error: 'Автоматическое соотношение поддерживает только разрешение 1K' },
        { status: 400 }
      )
    }

    const response = await createGptImageTask(mode as GptImageGenerationMode, {
      prompt,
      aspectRatio,
      resolution,
      inputUrls,
    })

    return NextResponse.json({ success: true, taskId: response.data.taskId })
  } catch (error: unknown) {
    console.error('GPT Image Generate API Error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
