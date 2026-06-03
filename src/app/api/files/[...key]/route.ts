import { getObject } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const objectKey = key.join('/');
    const { stream, contentType, size } = await getObject(objectKey);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks);

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
