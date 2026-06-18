This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## External API (`/api/v1`)

A unified external REST API that a central integrator service can consume the
same way as the other services — by changing only the base URL and API key.
The contract follows the shared standard: `/api/v1` prefix, `X-API-Key` auth,
JSON envelope, cursor pagination, idempotency, rate limiting and an OpenAPI document.

### Base URL

```
<EXTERNAL_API_PUBLIC_BASE_URL>/api/v1
# production: https://atom-avatar.<tailnet>.ts.net/api/v1
```

### Authentication

Every request (except `GET /health` and `GET /openapi.json`) requires the API key
in a header. Recommended headers:

```
X-API-Key: <api_key>
Content-Type: application/json
Accept: application/json
```

Optional headers:

- `X-Request-Id: <id>` — echoed back in `meta.request_id` (auto-generated if omitted).
- `Idempotency-Key: <unique>` — safe retries for `POST`/`DELETE` (duplicate keys replay the first response).

### Creating an API key

Keys are stored only as a salted HMAC-SHA256 hash; the raw key is shown **once**.
Set `EXTERNAL_API_KEY_HASH_SECRET` and `DATABASE_URL` first.

**Local / source environments** — use the CLI:

```bash
npx tsx scripts/apikey.ts create --name central-service --scopes read,write
npx tsx scripts/apikey.ts list
npx tsx scripts/apikey.ts revoke --id key_xxx
npx tsx scripts/apikey.ts bootstrap   # first key, no-op if any exist
```

**Containerized production** (the CLI is not bundled into the image) — seed the
first key via the environment. Put the **raw** key in `EXTERNAL_API_BOOTSTRAP_KEY`;
on startup the app hashes it and inserts it if the table is empty:

```bash
# generate a key value:
echo "atom_live_$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')"
# add EXTERNAL_API_BOOTSTRAP_KEY=<that value> to the server .env, then redeploy.
# Remove the var after the first boot once the key is stored.
```

Scopes: `read` (GET), `write` (POST/DELETE), `admin` (implies both).

### Endpoints

| Method | Path | Scope | Purpose |
|--------|------|-------|---------|
| GET | `/health` | public | Liveness probe |
| GET | `/meta` | read | Service metadata + capabilities |
| GET | `/auth/verify` | read | Validate the API key |
| GET | `/openapi.json` | public | OpenAPI 3 document |
| POST | `/generations` | write | Create a generation (`video` / `image` / `speech`) |
| GET | `/generations` | read | List generations (cursor pagination) |
| GET | `/generations/{id}` | read | Get a generation (polls the provider while pending) |
| DELETE | `/generations/{id}` | write | Cancel / delete a generation (best effort) |
| POST | `/actions/upload` | write | Ingest a remote URL or base64 payload into storage |
| GET | `/catalog/models` | read | Available models |
| GET | `/catalog/voices?provider=` | read | TTS / avatar voices |
| GET | `/catalog/presets` | read | Seedance emotion / camera / lighting presets |
| GET | `/account/credits?provider=` | read | Provider credit balances |

### curl examples

```bash
# Service metadata
curl -s "$BASE/api/v1/meta" -H "X-API-Key: $KEY" -H "Accept: application/json"

# Create a video generation (Seedance)
curl -s -X POST "$BASE/api/v1/generations" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"provider":"seedance","image_url":"https://example.com/face.jpg","spoken_text":"Hello!","resolution":"720p"}'

# Poll a generation
curl -s "$BASE/api/v1/generations/gen_123" -H "X-API-Key: $KEY"

# Upload an input image by URL
curl -s -X POST "$BASE/api/v1/actions/upload" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"source":"url","url":"https://example.com/face.jpg","kind":"image"}'
```

### Success response

```json
{
  "success": true,
  "data": { "id": "gen_...", "status": "queued", "kind": "video", "provider": "seedance", "model": "bytedance/seedance-2-fast" },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}
```

List responses add `meta.pagination` (`limit` default 50, max 100; `next_cursor`, `has_more`).
Query params: `limit`, `cursor`, `sort=created_at|-created_at`, `filter_status`, `filter_kind`.

### Error response

```json
{
  "success": false,
  "error": { "code": "unauthorized", "message": "API key missing or invalid" },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}
```

Error codes → HTTP: `bad_request` 400, `unauthorized` 401, `forbidden` 403, `not_found` 404,
`conflict` 409, `validation_error` 422 (with `error.details`), `rate_limited` 429, `internal_error` 500.

### Connecting from JavaScript/TypeScript

```ts
const response = await fetch(`${SERVICE_API_BASE_URL}/api/v1/meta`, {
  method: 'GET',
  headers: { 'X-API-Key': SERVICE_API_KEY, Accept: 'application/json' },
});
const result = await response.json();
if (!result.success) {
  throw new Error(`${result.error.code}: ${result.error.message}`);
}
console.log(result.data);
```

### OpenAPI

The full specification is served at `GET /api/v1/openapi.json` (public).

### Environment variables

See `.env.example` — `EXTERNAL_API_ENABLED`, `EXTERNAL_API_RATE_LIMIT_PER_MINUTE`,
`EXTERNAL_API_PUBLIC_BASE_URL`, `EXTERNAL_API_KEY_HASH_SECRET` (required), `DATABASE_URL`.
The metadata store is PostgreSQL. For local dev start it with `docker compose up -d postgres`
and use `DATABASE_URL=postgresql://atom:atom@localhost:5432/atom_api`.

### Running the tests

```bash
npm test          # vitest — includes the external-API suite in src/__tests__/v1
npm run db:generate   # regenerate SQL migrations after changing src/lib/api/schema.ts
```

### Limitations

- Rate limiting is in-memory (single instance): the window resets on restart and is not shared across instances.
- KIE/HeyGen expose no public cancel — `DELETE` marks the record `canceled` and stops polling.
- `actions/upload` via base64 is bounded by the request body size; prefer `source: "url"` for large files.
- Speech (TTS) generations complete synchronously; video/image are asynchronous (poll `GET /generations/{id}`).
