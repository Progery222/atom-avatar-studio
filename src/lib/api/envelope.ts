export const SERVICE_NAME = 'atom-avatar-studio';
export const API_VERSION = 'v1';

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'rate_limited'
  | 'internal_error';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation_error: 422,
  rate_limited: 429,
  internal_error: 500,
};

export interface Pagination {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface Meta {
  request_id: string;
  service: string;
  api_version: string;
  pagination?: Pagination;
}

export interface SuccessEnvelope<T = unknown> {
  success: true;
  data: T;
  meta: Meta;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  meta: Meta;
}

/** Error type that maps onto the spec's standard HTTP statuses + error codes. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export function buildMeta(requestId: string, pagination?: Pagination): Meta {
  return {
    request_id: requestId,
    service: SERVICE_NAME,
    api_version: API_VERSION,
    ...(pagination ? { pagination } : {}),
  };
}

export function successEnvelope<T>(data: T, meta: Meta): SuccessEnvelope<T> {
  return { success: true, data, meta };
}

export function errorEnvelope(
  code: ApiErrorCode,
  message: string,
  meta: Meta,
  details?: unknown,
): ErrorEnvelope {
  return {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    meta,
  };
}

// ── Convenience throwers used by handlers ────────────────────────────────────
export const badRequest = (m = 'Invalid request', d?: unknown) => new ApiError('bad_request', m, d);
export const unauthorized = (m = 'API key missing or invalid') => new ApiError('unauthorized', m);
export const forbidden = (m = 'Insufficient scope') => new ApiError('forbidden', m);
export const notFound = (m = 'Resource not found') => new ApiError('not_found', m);
export const conflict = (m = 'Conflict', d?: unknown) => new ApiError('conflict', m, d);
export const validationError = (m = 'Validation failed', d?: unknown) =>
  new ApiError('validation_error', m, d);
export const rateLimited = (m = 'Rate limit exceeded') => new ApiError('rate_limited', m);
export const internalError = (m = 'Internal server error') => new ApiError('internal_error', m);
