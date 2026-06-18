import * as Minio from 'minio';
import type { Readable } from 'stream';

/**
 * Server-side object storage backed by MinIO (S3-compatible).
 * Files are stored privately in MinIO and served back to the public through
 * the app's own `/api/files/<key>` route (see PUBLIC_BASE_URL), so MinIO itself
 * never needs to be exposed to the internet.
 *
 * Must only be imported from server code (API routes), never client components.
 */

const endpoint = new URL(process.env.S3_ENDPOINT || 'http://minio:9000');
const BUCKET = process.env.S3_BUCKET || 'media';
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');

let _client: Minio.Client | null = null;
function getClient(): Minio.Client {
  if (!_client) {
    _client = new Minio.Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? parseInt(endpoint.port, 10) : endpoint.protocol === 'https:' ? 443 : 80,
      useSSL: endpoint.protocol === 'https:',
      accessKey: process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.S3_SECRET_KEY || '',
    });
  }
  return _client;
}

let _bucketReady = false;
async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const client = getClient();
  const exists = await client.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await client.makeBucket(BUCKET);
  }
  _bucketReady = true;
}

/** Public URL through which the app serves the stored object. */
export function publicUrlForKey(key: string): string {
  return `${PUBLIC_BASE}/api/files/${key.replace(/^\/+/, '')}`;
}

/** Upload a file and return its public URL. */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string,
): Promise<string> {
  await ensureBucket();
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  await getClient().putObject(
    BUCKET,
    key,
    buf,
    buf.length,
    contentType ? { 'Content-Type': contentType } : undefined,
  );
  return publicUrlForKey(key);
}

/** Fetch a stored object's stream + metadata for serving. */
export async function getObject(
  key: string,
): Promise<{ stream: Readable; contentType: string; size: number }> {
  const client = getClient();
  const stat = await client.statObject(BUCKET, key);
  const stream = await client.getObject(BUCKET, key);
  return {
    stream,
    contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
    size: stat.size,
  };
}

/** List all objects (recursively) under an optional key prefix. */
export async function listObjects(
  prefix = '',
): Promise<Array<{ key: string; lastModified: Date; size: number }>> {
  await ensureBucket();
  const client = getClient();
  return new Promise((resolve, reject) => {
    const out: Array<{ key: string; lastModified: Date; size: number }> = [];
    const stream = client.listObjectsV2(BUCKET, prefix, true);
    stream.on('data', (obj) => {
      if (obj.name) {
        out.push({ key: obj.name, lastModified: obj.lastModified, size: obj.size });
      }
    });
    stream.on('end', () => resolve(out));
    stream.on('error', reject);
  });
}

/** Delete a single stored object. */
export async function removeObject(key: string): Promise<void> {
  await getClient().removeObject(BUCKET, key);
}

/** Delete many stored objects in one batch. No-op on an empty list. */
export async function removeObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await getClient().removeObjects(BUCKET, keys);
}
