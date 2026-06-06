import { z } from 'zod';
import { createGenerationRequestUnion } from '@/app/api/v1/_schemas/generations';
import { uploadSchema } from '@/app/api/v1/_schemas/actions';

/**
 * Builds the OpenAPI 3.0.3 document for the external API. Request-body schemas
 * are generated from the same zod schemas used for validation (via zod 4's
 * native JSON-Schema export), so they never drift; the rest is hand-assembled.
 */

let cached: Record<string, unknown> | null = null;

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }) as Record<string, unknown>;
}

function baseServerUrl(): string {
  const base = (process.env.EXTERNAL_API_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || '').replace(
    /\/+$/,
    '',
  );
  return `${base}/api/v1`;
}

const ERROR_CODES = [
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation_error',
  'rate_limited',
  'internal_error',
];

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema: object) => ({ content: { 'application/json': { schema } } });

function successOf(dataSchema: object) {
  return {
    type: 'object',
    properties: { success: { type: 'boolean', enum: [true] }, data: dataSchema, meta: ref('Meta') },
    required: ['success', 'data', 'meta'],
  };
}

const SECURITY = [{ ApiKeyAuth: [] }];

function errorResponses(): Record<string, unknown> {
  const body = jsonBody(ref('ErrorEnvelope'));
  return {
    '400': { description: 'Bad request', ...body },
    '401': { description: 'Unauthorized', ...body },
    '403': { description: 'Forbidden', ...body },
    '404': { description: 'Not found', ...body },
    '409': { description: 'Conflict', ...body },
    '422': { description: 'Validation error', ...body },
    '429': { description: 'Rate limited', ...body },
    '500': { description: 'Internal error', ...body },
  };
}

export function buildOpenApiDocument(): Record<string, unknown> {
  if (cached) {
    return cached;
  }

  const components = {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'integer' },
          next_cursor: { type: 'string', nullable: true },
          has_more: { type: 'boolean' },
        },
        required: ['limit', 'next_cursor', 'has_more'],
      },
      Meta: {
        type: 'object',
        properties: {
          request_id: { type: 'string' },
          service: { type: 'string' },
          api_version: { type: 'string' },
          pagination: ref('Pagination'),
        },
        required: ['request_id', 'service', 'api_version'],
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', enum: ERROR_CODES },
              message: { type: 'string' },
              details: {},
            },
            required: ['code', 'message'],
          },
          meta: ref('Meta'),
        },
        required: ['success', 'error', 'meta'],
      },
      Generation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['video', 'image', 'speech'] },
          provider: { type: 'string' },
          model: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'processing', 'succeeded', 'failed', 'canceled'] },
          result: {},
          error: {},
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
        required: ['id', 'kind', 'provider', 'model', 'status', 'created_at', 'updated_at'],
      },
      CreateGenerationRequest: jsonSchema(createGenerationRequestUnion),
      UploadRequest: jsonSchema(uploadSchema),
    },
  };

  const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  };

  const paths = {
    '/health': {
      get: {
        summary: 'Liveness probe (public)',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            ...jsonBody(successOf({ type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } })),
          },
        },
      },
    },
    '/meta': {
      get: {
        summary: 'Service metadata',
        responses: {
          '200': {
            description: 'OK',
            ...jsonBody(
              successOf({
                type: 'object',
                properties: {
                  service: { type: 'string' },
                  api_version: { type: 'string' },
                  capabilities: { type: 'array', items: { type: 'string' } },
                  documentation_url: { type: 'string' },
                },
              }),
            ),
          },
          ...errorResponses(),
        },
      },
    },
    '/auth/verify': {
      get: {
        summary: 'Verify the API key',
        responses: {
          '200': {
            description: 'OK',
            ...jsonBody(
              successOf({
                type: 'object',
                properties: {
                  valid: { type: 'boolean' },
                  key_id: { type: 'string' },
                  scopes: { type: 'array', items: { type: 'string' } },
                  expires_at: { type: 'string', nullable: true },
                },
              }),
            ),
          },
          ...errorResponses(),
        },
      },
    },
    '/openapi.json': {
      get: { summary: 'This OpenAPI document (public)', security: [], responses: { '200': { description: 'OpenAPI 3 document' } } },
    },
    '/generations': {
      post: {
        summary: 'Create a generation (video | image | speech)',
        description: 'Requires the `write` scope. Supports the `Idempotency-Key` header.',
        requestBody: { required: true, ...jsonBody(ref('CreateGenerationRequest')) },
        responses: {
          '200': { description: 'Synchronous result (speech)', ...jsonBody(successOf(ref('Generation'))) },
          '202': { description: 'Accepted (async video/image)', ...jsonBody(successOf(ref('Generation'))) },
          ...errorResponses(),
        },
      },
      get: {
        summary: 'List generations (cursor pagination)',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['created_at', '-created_at'] } },
          { name: 'filter_status', in: 'query', schema: { type: 'string', enum: ['queued', 'processing', 'succeeded', 'failed', 'canceled'] } },
          { name: 'filter_kind', in: 'query', schema: { type: 'string', enum: ['video', 'image', 'speech'] } },
        ],
        responses: {
          '200': { description: 'OK', ...jsonBody(successOf({ type: 'array', items: ref('Generation') })) },
          ...errorResponses(),
        },
      },
    },
    '/generations/{id}': {
      get: {
        summary: 'Get a generation (polls the provider when pending)',
        parameters: [idParam],
        responses: { '200': { description: 'OK', ...jsonBody(successOf(ref('Generation'))) }, ...errorResponses() },
      },
      delete: {
        summary: 'Cancel/delete a generation (best effort)',
        parameters: [idParam],
        responses: { '200': { description: 'OK', ...jsonBody(successOf(ref('Generation'))) }, ...errorResponses() },
      },
    },
    '/actions/upload': {
      post: {
        summary: 'Ingest a remote URL or base64 payload into storage',
        requestBody: { required: true, ...jsonBody(ref('UploadRequest')) },
        responses: {
          '200': {
            description: 'OK',
            ...jsonBody(successOf({ type: 'object', properties: { url: { type: 'string' }, content_type: { type: 'string' }, bytes: { type: 'integer' } } })),
          },
          ...errorResponses(),
        },
      },
    },
    '/catalog/models': {
      get: { summary: 'List available generation models', responses: { '200': { description: 'OK', ...jsonBody(successOf({ type: 'array', items: { type: 'object' } })) }, ...errorResponses() } },
    },
    '/catalog/voices': {
      get: {
        summary: 'List TTS / avatar voices for a provider',
        parameters: [{ name: 'provider', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK', ...jsonBody(successOf({ type: 'array', items: { type: 'object' } })) }, ...errorResponses() },
      },
    },
    '/catalog/presets': {
      get: { summary: 'List Seedance emotion / camera / lighting presets', responses: { '200': { description: 'OK', ...jsonBody(successOf({ type: 'object' })) }, ...errorResponses() } },
    },
    '/account/credits': {
      get: {
        summary: 'Provider credit balances',
        parameters: [{ name: 'provider', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'OK', ...jsonBody(successOf({ type: 'array', items: { type: 'object' } })) }, ...errorResponses() },
      },
    },
  };

  const document = {
    openapi: '3.0.3',
    info: {
      title: 'Atom Avatar Studio External API',
      version: '1.0.0',
      description: 'Unified external API for AI avatar video, image and speech generation.',
    },
    servers: [{ url: baseServerUrl() }],
    security: SECURITY,
    components,
    paths,
  };

  cached = document;
  return cached;
}
