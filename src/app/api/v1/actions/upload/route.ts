import { z } from 'zod';
import { withApi } from '@/lib/api/with-api';
import { badRequest, validationError } from '@/lib/api/envelope';
import { newId } from '@/lib/api/keys';
import { putObject } from '@/lib/storage';
import { uploadSchema } from '@/app/api/v1/_schemas/actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
};

function pickExt(contentType: string, kind: 'image' | 'audio', filename?: string): string {
  const fromName = filename?.split('.').pop();
  if (fromName && fromName.length <= 5 && /^[a-z0-9]+$/i.test(fromName)) {
    return fromName.toLowerCase();
  }
  const base = contentType.split(';')[0].trim().toLowerCase();
  return EXT_BY_CONTENT_TYPE[base] ?? (kind === 'image' ? 'jpg' : 'mp3');
}

export const POST = withApi(
  async (_req, ctx) => {
    const parsed = uploadSchema.safeParse(ctx.json());
    if (!parsed.success) {
      throw validationError('Invalid upload request', z.flattenError(parsed.error));
    }
    const input = parsed.data;

    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    if (input.source === 'url') {
      const res = await fetch(input.url);
      if (!res.ok) {
        throw badRequest(`Failed to fetch url (HTTP ${res.status})`);
      }
      contentType =
        res.headers.get('content-type')?.split(';')[0].trim() ||
        (input.kind === 'image' ? 'image/jpeg' : 'audio/mpeg');
      buffer = Buffer.from(await res.arrayBuffer());
      ext = pickExt(contentType, input.kind);
    } else {
      contentType = input.content_type;
      buffer = Buffer.from(input.data, 'base64');
      if (buffer.length === 0) {
        throw badRequest('Decoded base64 payload is empty');
      }
      ext = pickExt(contentType, input.kind, input.filename);
    }

    const key = `uploads/${newId(input.kind)}.${ext}`;
    const url = await putObject(key, buffer, contentType);
    return { data: { url, content_type: contentType, bytes: buffer.length } };
  },
  { scope: 'write', idempotent: true },
);
