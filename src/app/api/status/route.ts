import { NextResponse } from 'next/server';
import { getKieTaskStatus } from '@/lib/kie';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 });
    }

    const taskStatus = await getKieTaskStatus(taskId);

    return NextResponse.json({ success: true, data: taskStatus });
  } catch (error: any) {
    console.error("Status API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
