import { NextRequest, NextResponse } from 'next/server'
import { HEYGEN_ERROR_MESSAGES } from '@/constants/heygen'
import { getVideoStatus } from '@/lib/heygen'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'videoId обязателен' }, { status: 200 })
    }

    const result = await getVideoStatus(videoId)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    const err = error as Error & { code?: string }
    const code = err.code ?? 'internal_error'
    const message = HEYGEN_ERROR_MESSAGES[code] ?? err.message ?? 'Ошибка получения статуса'

    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
