import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ApiError,
  buildMeta,
  errorEnvelope,
  successEnvelope,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  validationError,
  type Pagination,
} from './envelope';
import { authenticate, hasScope, touchLastUsed, type AuthedKey } from './auth';
import { parseJsonBody, isExternalApiEnabled } from './http';
import * as rateLimit from './rate-limit';
import * as idempotency from './idempotency';
import type { ApiScope } from './schema';

export interface ApiContext {
  requestId: string;
  apiKey: AuthedKey | null;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  rawBody: string;
  /** Parsed JSON body (throws bad_request on missing/invalid JSON). */
  json<T = unknown>(): T;
}

export interface HandlerResult {
  data: unknown;
  status?: number;
  pagination?: Pagination;
}

export interface WithApiOptions {
  scope?: ApiScope;
  public?: boolean;
  rateLimit?: boolean;
  idempotent?: boolean;
}

type RouteParams = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: ApiContext) => Promise<HandlerResult> | HandlerResult;

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '')}`;
}

function respond(
  status: number,
  body: { meta: { request_id: string } },
  extraHeaders: Record<string, string>,
): NextResponse {
  const res = NextResponse.json(body, { status });
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.headers.set(k, v);
  }
  res.headers.set('X-Request-Id', body.meta.request_id);
  return res;
}

/**
 * Wraps a route handler with the external-API cross-cutting concerns: request_id
 * propagation, X-API-Key auth + scope enforcement, per-key rate limiting,
 * Idempotency-Key handling, the success/error JSON envelope, and error→code mapping.
 */
export function withApi(handler: Handler, opts: WithApiOptions = {}) {
  return async (req: Request, routeParams?: RouteParams): Promise<NextResponse> => {
    const requestId = req.headers.get('X-Request-Id')?.trim() || generateRequestId();
    let rlHeaders: Record<string, string> = {};
    let idempotencyId: string | null = null;

    try {
      if (!isExternalApiEnabled()) {
        throw notFound();
      }

      let rawBody = '';
      if (MUTATION_METHODS.has(req.method)) {
        rawBody = await req.text();
      }

      // ── Auth ──
      let apiKey: AuthedKey | null = null;
      if (!opts.public) {
        const raw = req.headers.get('X-API-Key');
        if (!raw) {
          throw unauthorized();
        }
        apiKey = await authenticate(raw);
        if (opts.scope && !hasScope(apiKey, opts.scope)) {
          throw forbidden();
        }
        touchLastUsed(apiKey.id);
      }

      // ── Rate limit ──
      if (apiKey && opts.rateLimit !== false) {
        const rl = rateLimit.check(apiKey.id);
        rlHeaders = rl.headers;
        if (!rl.allowed) {
          return respond(
            429,
            errorEnvelope('rate_limited', 'Rate limit exceeded', buildMeta(requestId)),
            rlHeaders,
          );
        }
      }

      // ── Idempotency ──
      if (apiKey && opts.idempotent && MUTATION_METHODS.has(req.method)) {
        const key = req.headers.get('Idempotency-Key')?.trim();
        if (key) {
          const path = new URL(req.url).pathname;
          const outcome = await idempotency.begin(apiKey.id, key, req.method, path, rawBody);
          if (outcome.type === 'replay') {
            const stored = outcome.body;
            const body =
              stored && typeof stored === 'object'
                ? {
                    ...(stored as Record<string, unknown>),
                    meta: {
                      ...((stored as { meta?: Record<string, unknown> }).meta ?? {}),
                      request_id: requestId,
                    },
                  }
                : stored;
            return respond(outcome.statusCode, body as { meta: { request_id: string } }, rlHeaders);
          }
          if (outcome.type === 'in_progress') {
            throw conflict('A request with this Idempotency-Key is already in progress');
          }
          if (outcome.type === 'mismatch') {
            throw validationError(
              'Idempotency-Key was already used with a different request body',
            );
          }
          idempotencyId = outcome.id;
        }
      }

      // ── Handler ──
      const params = routeParams ? await routeParams.params : {};
      const searchParams = new URL(req.url).searchParams;
      const ctx: ApiContext = {
        requestId,
        apiKey,
        params,
        searchParams,
        rawBody,
        json<T = unknown>(): T {
          return parseJsonBody(rawBody) as T;
        },
      };

      const result = await handler(req, ctx);
      const status = result.status ?? 200;
      const body = successEnvelope(result.data, buildMeta(requestId, result.pagination));

      if (idempotencyId) {
        await idempotency.complete(idempotencyId, status, body);
      }
      return respond(status, body, rlHeaders);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('internal_error', 'Internal server error');
      if (err.httpStatus >= 500) {
        console.error(
          `[api] ${err.code} request_id=${requestId}:`,
          e instanceof Error ? e.message : e,
        );
      }
      if (idempotencyId) {
        try {
          await idempotency.fail(idempotencyId);
        } catch {
          // best effort
        }
      }
      return respond(
        err.httpStatus,
        errorEnvelope(err.code, err.message, buildMeta(requestId), err.details),
        rlHeaders,
      );
    }
  };
}
