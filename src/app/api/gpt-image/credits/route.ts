import { NextResponse } from 'next/server';
import { getGptImageCredits } from '@/lib/gpt-image';

export async function GET() {
  try {
    const response = await getGptImageCredits();
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    console.error('Error fetching GPT image credits:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
