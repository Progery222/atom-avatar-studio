import { NextRequest, NextResponse } from 'next/server'
import { HEYGEN_ERROR_MESSAGES } from '@/constants/heygen'
import { listVoices } from '@/lib/heygen'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gender = searchParams.get('gender') ?? undefined
    const language = searchParams.get('language') ?? undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100

    const voices = await listVoices({ gender, language, limit })
    return NextResponse.json({ success: true, data: voices })
  } catch (error) {
    const err = error as Error & { code?: string }
    const code = err.code ?? 'internal_error'
    const message = HEYGEN_ERROR_MESSAGES[code] ?? err.message ?? 'Ошибка загрузки голосов'

    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
