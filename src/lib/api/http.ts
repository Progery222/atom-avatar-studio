import { badRequest } from './envelope';

/** Parses a raw request body as JSON, mapping failures to `bad_request` (400). */
export function parseJsonBody(raw: string): unknown {
  if (!raw || raw.trim() === '') {
    throw badRequest('Request body is required and must be JSON');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw badRequest('Invalid JSON in request body');
  }
}

/** The external API is enabled unless explicitly switched off. */
export function isExternalApiEnabled(): boolean {
  const flag = process.env.EXTERNAL_API_ENABLED;
  return flag !== 'false' && flag !== '0';
}
