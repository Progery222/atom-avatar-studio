import { NextRequest, NextResponse } from 'next/server'
import { pollGptImageTask } from '@/lib/gpt-image'

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      )
    }

    const result = await pollGptImageTask(taskId)

    return NextResponse.json({
      success: true,
      state: result.state,
      ...(result.resultUrls && { resultUrls: result.resultUrls }),
      ...(result.failCode && { failCode: result.failCode }),
      ...(result.failMsg && { failMsg: result.failMsg }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GPT Image Status API Error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
