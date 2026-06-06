import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ── Domain unions (kept in sync with zod schemas + OpenAPI) ──────────────────
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
export type ApiScope = 'read' | 'write' | 'admin';
export type GenerationKind = 'video' | 'image' | 'speech';
export type GenerationStatus =
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';
export type IdempotencyStatus = 'in_progress' | 'completed';

const nowMs = sql`(unixepoch() * 1000)`;

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    keyHash: text('key_hash').notNull(),
    scopes: text('scopes', { mode: 'json' }).$type<ApiScope[]>().notNull(),
    status: text('status').$type<ApiKeyStatus>().notNull().default('active'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    uniqueIndex('api_keys_key_prefix_uidx').on(t.keyPrefix),
    index('api_keys_status_idx').on(t.status),
  ],
);

export const idempotencyKeys = sqliteTable(
  'idempotency_keys',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apiKeys.id),
    method: text('method').notNull(),
    path: text('path').notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status').$type<IdempotencyStatus>().notNull().default('in_progress'),
    responseJson: text('response_json', { mode: 'json' }).$type<unknown>(),
    statusCode: integer('status_code'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    uniqueIndex('idempotency_keys_owner_uidx').on(t.apiKeyId, t.key),
    index('idempotency_keys_expires_idx').on(t.expiresAt),
  ],
);

export const generations = sqliteTable(
  'generations',
  {
    id: text('id').primaryKey(),
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apiKeys.id),
    kind: text('kind').$type<GenerationKind>().notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    status: text('status').$type<GenerationStatus>().notNull().default('queued'),
    providerTaskId: text('provider_task_id'),
    inputJson: text('input_json', { mode: 'json' }).$type<unknown>().notNull(),
    resultJson: text('result_json', { mode: 'json' }).$type<unknown>(),
    errorJson: text('error_json', { mode: 'json' }).$type<{ code: string; message: string } | null>(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  },
  (t) => [
    index('generations_owner_created_idx').on(t.apiKeyId, t.createdAt, t.id),
    index('generations_status_idx').on(t.apiKeyId, t.status),
    index('generations_provider_task_idx').on(t.providerTaskId),
  ],
);

export type ApiKeyRow = typeof apiKeys.$inferSelect;
export type GenerationRow = typeof generations.$inferSelect;
export type IdempotencyRow = typeof idempotencyKeys.$inferSelect;
