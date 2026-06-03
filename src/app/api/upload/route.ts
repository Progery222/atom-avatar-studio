import { NextResponse } from 'next/server';
import { putObject } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const path = form.get('path');

    if (!(file instanceof File) || typeof path !== 'string' || !path) {
      return NextResponse.json(
        { success: false, error: 'file and path are required' },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const url = await putObject(path, buf, file.type || 'application/octet-stream');
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('[Upload API] Error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'upload failed' },
      { status: 500 },
    );
  }
}
