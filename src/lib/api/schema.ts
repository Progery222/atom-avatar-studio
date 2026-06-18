import { pgTable, text, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

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

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    keyHash: text('key_hash').notNull(),
    scopes: jsonb('scopes').$type<ApiScope[]>().notNull(),
    status: text('status').$type<ApiKeyStatus>().notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => [
    uniqueIndex('api_keys_key_prefix_uidx').on(t.keyPrefix),
    index('api_keys_status_idx').on(t.status),
  ],
);

export const idempotencyKeys = pgTable(
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
    responseJson: jsonb('response_json').$type<unknown>(),
    statusCode: integer('status_code'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (t) => [
    uniqueIndex('idempotency_keys_owner_uidx').on(t.apiKeyId, t.key),
    index('idempotency_keys_expires_idx').on(t.expiresAt),
  ],
);

export const generations = pgTable(
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
    inputJson: jsonb('input_json').$type<unknown>().notNull(),
    resultJson: jsonb('result_json').$type<unknown>(),
    errorJson: jsonb('error_json').$type<{ code: string; message: string } | null>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
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
