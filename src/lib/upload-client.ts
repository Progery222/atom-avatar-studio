'use client';

/**
 * Client-side file upload. Posts the file to the app's own /api/upload route
 * (same-origin, no CORS), which stores it in MinIO and returns a public URL
 * that external APIs (KIE.ai / HeyGen) can fetch.
 */
export async function uploadFile(path: string, file: File | Blob): Promise<string> {
  const form = new FormData();
  form.append('path', path);
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: form });
  } catch (err: any) {
    throw new Error(`Upload failed: ${err?.message || 'network error'}`);
  }

  if (!res.ok) {
    let msg = `Upload failed (status: ${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = `Upload failed: ${j.error}`;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data?.url) throw new Error('Upload failed: no url returned');
  return data.url as string;
}
