import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Composition } from '@/types/hyperframes'

const BUCKET = 'hyperframes-compositions'
const PREFIX = 'compositions/anonymous'

function storagePath(id: string) {
  return `${PREFIX}/${id}.json`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const { data: blob, error } = await supabase.storage
      .from(BUCKET)
      .download(storagePath(id))

    if (error) {
      return NextResponse.json({ success: false, error: 'Composition not found' }, { status: 200 })
    }

    const text = await blob.text()
    const composition = JSON.parse(text) as Composition

    return NextResponse.json({ success: true, data: composition })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load composition'
    console.error('[Compositions] GET by ID error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.name || !body.html || !body.tracks) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, html, tracks' },
        { status: 200 },
      )
    }

    const now = Date.now()
    const composition: Composition = {
      id,
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
      .upload(storagePath(id), blob, { upsert: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update composition'
    console.error('[Compositions] PUT error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath(id)])

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete composition'
    console.error('[Compositions] DELETE error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
