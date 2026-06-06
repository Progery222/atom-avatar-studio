import { NextResponse } from 'next/server';
import { buildOpenApiDocument } from '@/lib/api/openapi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public: returns the raw OpenAPI 3 document (not wrapped in the API envelope)
// so standard OpenAPI tooling can consume it directly.
export function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
