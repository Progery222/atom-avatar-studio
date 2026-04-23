import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Composition } from '@/types/hyperframes'

const BUCKET = 'hyperframes-compositions'
const PREFIX = 'compositions/anonymous'

export async function GET() {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(PREFIX, { sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    const compositions: Composition[] = []

    for (const file of files ?? []) {
      if (!file.name.endsWith('.json')) continue

      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(`${PREFIX}/${file.name}`)

      if (downloadError || !blob) continue

      const text = await blob.text()
      try {
        const composition = JSON.parse(text) as Composition
        compositions.push(composition)
      } catch {
        continue
      }
    }

    return NextResponse.json({ success: true, data: compositions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list compositions'
    console.error('[Compositions] GET error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id || !body.name || !body.html || !body.tracks) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, html, tracks' },
        { status: 200 },
      )
    }

    const now = Date.now()
    const composition: Composition = {
      id: body.id,
      name: body.name,
      html: body.html,
      css: body.css ?? '',
      width: body.width ?? 1920,
      height: body.height ?? 1080,
      fps: body.fps ?? 30,
      duration: body.duration ?? 0,
      tracks: body.tracks,
      metadata: body.metadata ?? { author: 'anonymous', tags: [], description: '', templateId: null },
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    }

    const json = JSON.stringify(composition)
    const bytes = new TextEncoder().encode(json)
    const blob = new Blob([bytes], { type: 'application/json' })

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${PREFIX}/${composition.id}.json`, blob, { upsert: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ success: true, data: { id: composition.id } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save composition'
    console.error('[Compositions] POST error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
