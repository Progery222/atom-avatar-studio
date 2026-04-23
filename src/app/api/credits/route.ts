import { NextResponse } from 'next/server';
import { getKieCredits } from '@/lib/kie';

export async function GET() {
  try {
    const data = await getKieCredits();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
