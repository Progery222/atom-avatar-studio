import { NextResponse } from 'next/server'
import { HEYGEN_ERROR_MESSAGES } from '@/constants/heygen'
import { getBalance } from '@/lib/heygen'

export async function GET() {
  try {
    const data = await getBalance()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const err = error as Error & { code?: string }
    const code = err.code ?? 'internal_error'
    const message = HEYGEN_ERROR_MESSAGES[code] ?? err.message ?? 'Ошибка получения баланса'

    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
