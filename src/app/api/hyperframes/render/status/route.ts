import { NextRequest, NextResponse } from 'next/server';
import { getJob, listJobs } from '@/lib/hyperframes/render-jobs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = getJob(jobId);
      if (!job) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 200 });
      }
      return NextResponse.json({ success: true, data: job });
    }

    return NextResponse.json({ success: true, data: listJobs() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
