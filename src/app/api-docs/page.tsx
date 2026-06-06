'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Rocket,
  KeyRound,
  ShieldCheck,
  FileJson,
  Boxes,
  ListOrdered,
  Repeat,
  PlugZap,
  Code2,
} from 'lucide-react';
import { CodeBlock } from '@/components/api-docs/code-block';
import { EndpointCard } from '@/components/api-docs/endpoint-card';
import { ConnectionTester } from '@/components/api-docs/connection-tester';
import { ENDPOINT_GROUPS, GENERATION_EXAMPLES, ERROR_CODES } from './content';

const CURL_META = `curl -s "$BASE_URL/api/v1/meta" \\
  -H "X-API-Key: $API_KEY" \\
  -H "Accept: application/json"`;

const JS_SNIPPET = `const response = await fetch(\`\${SERVICE_API_BASE_URL}/api/v1/meta\`, {
  method: 'GET',
  headers: { 'X-API-Key': SERVICE_API_KEY, Accept: 'application/json' },
});

const result = await response.json();
if (!result.success) {
  throw new Error(\`\${result.error.code}: \${result.error.message}\`);
}
console.log(result.data);`;

const CURL_CREATE = `curl -s -X POST "$BASE_URL/api/v1/generations" \\
  -H "X-API-Key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"seedance","image_url":"https://example.com/face.jpg","spoken_text":"Привет!"}'`;

const REQUIRED_HEADERS = `X-API-Key: <api_key>
Content-Type: application/json
Accept: application/json`;

const OPTIONAL_HEADERS = `X-Request-Id: <id>          # эхо в meta.request_id (иначе генерируется сам)
Idempotency-Key: <unique>   # безопасные повторы POST/DELETE`;

const KEYS_CLI = `# Локально / у оператора сервиса:
npx tsx scripts/apikey.ts create --name central-service --scopes read,write
npx tsx scripts/apikey.ts bootstrap        # первый ключ на пустой БД

# В продакшене (внутри контейнера):
docker exec atom-avatar-app node scripts/apikey.js create --name central --scopes read,write`;

const SUCCESS_ENVELOPE = `{
  "success": true,
  "data": { /* полезная нагрузка */ },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`;

const ERROR_ENVELOPE = `{
  "success": false,
  "error": { "code": "validation_error", "message": "Понятное сообщение об ошибке", "details": {} },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`;

const PAGINATION_EXAMPLE = `GET /api/v1/generations?limit=50&cursor=<cursor>&sort=-created_at&filter_status=succeeded`;

const TOC = [
  { id: 'quickstart', label: 'Быстрый старт' },
  { id: 'auth', label: 'Аутентификация' },
  { id: 'keys', label: 'Получение ключа' },
  { id: 'responses', label: 'Формат ответов' },
  { id: 'endpoints', label: 'Эндпоинты' },
  { id: 'pagination', label: 'Пагинация' },
  { id: 'idempotency', label: 'Идемпотентность и лимиты' },
  { id: 'tester', label: 'Проверка подключения' },
];

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> В студию
        </Link>
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors"
        >
          OpenAPI <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">API Atom Avatar Studio</h1>
        </div>
        <p className="text-white/50 max-w-2xl">
          Внешний REST API для генерации видео-аватаров, изображений и озвучки. Единый формат для всех
          сервисов: подключение через Base URL и API-ключ. Чтобы начать, нужно лишь поменять две вещи —
          адрес сервиса и ключ.
        </p>
        <div className="mt-5">
          <CodeBlock label="Base URL" code="https://<ваш-домен>/api/v1" />
        </div>
      </motion.header>

      {/* TOC */}
      <nav className="flex flex-wrap gap-2 mb-12">
        {TOC.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 bg-white/5 border border-white/10 hover:border-primary/40 hover:text-white transition-all"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        {/* Quick start */}
        <Section id="quickstart" title="Быстрый старт" icon={Rocket}>
          <p className="text-sm text-white/50">
            Любой запрос (кроме <code className="font-mono text-white/70">/health</code> и{' '}
            <code className="font-mono text-white/70">/openapi.json</code>) требует заголовок{' '}
            <code className="font-mono text-white/70">X-API-Key</code>. Первый вызов — получить метаданные сервиса:
          </p>
          <CodeBlock label="curl" code={CURL_META} />
          <CodeBlock label="JavaScript / TypeScript" code={JS_SNIPPET} />
          <p className="text-sm text-white/50">Создать генерацию видео:</p>
          <CodeBlock label="curl" code={CURL_CREATE} />
        </Section>

        {/* Auth */}
        <Section id="auth" title="Аутентификация" icon={ShieldCheck}>
          <p className="text-sm text-white/50">Обязательные заголовки клиента:</p>
          <CodeBlock label="Headers" code={REQUIRED_HEADERS} />
          <p className="text-sm text-white/50">Дополнительно поддерживаются:</p>
          <CodeBlock label="Optional headers" code={OPTIONAL_HEADERS} />
          <p className="text-sm text-white/50">
            Права ключа (<span className="font-mono text-white/70">scopes</span>):{' '}
            <span className="font-mono text-white/70">read</span> — чтение (GET),{' '}
            <span className="font-mono text-white/70">write</span> — изменение (POST/DELETE),{' '}
            <span className="font-mono text-white/70">admin</span> — оба.
          </p>
        </Section>

        {/* Keys */}
        <Section id="keys" title="Как получить ключ" icon={KeyRound}>
          <p className="text-sm text-white/50">
            Если вы <strong className="text-white/80">подключаетесь к чужому сервису</strong> — запросите
            API-ключ у его оператора. Ключ передаётся в заголовке{' '}
            <code className="font-mono text-white/70">X-API-Key</code>.
          </p>
          <p className="text-sm text-white/50">
            Если вы <strong className="text-white/80">оператор сервиса</strong> — создайте ключ через CLI. Сырой
            ключ показывается <strong className="text-white/80">только один раз</strong>; в базе хранится только
            его хеш.
          </p>
          <CodeBlock label="CLI" code={KEYS_CLI} />
        </Section>

        {/* Responses */}
        <Section id="responses" title="Формат ответов" icon={FileJson}>
          <p className="text-sm text-white/50">Все ответы — JSON в едином конверте.</p>
          <CodeBlock label="Успех" code={SUCCESS_ENVELOPE} />
          <CodeBlock label="Ошибка" code={ERROR_ENVELOPE} />
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="px-4 py-2 font-medium">HTTP</th>
                  <th className="px-4 py-2 font-medium">code</th>
                  <th className="px-4 py-2 font-medium">Когда</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_CODES.map((row) => (
                  <tr key={row.code} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2 font-mono text-white/70">{row.http}</td>
                    <td className="px-4 py-2 font-mono text-primary">{row.code}</td>
                    <td className="px-4 py-2 text-white/50">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Endpoints */}
        <Section id="endpoints" title="Эндпоинты" icon={Boxes}>
          <div className="space-y-3">
            <p className="text-sm text-white/50">
              Тело <code className="font-mono text-white/70">POST /api/v1/generations</code> зависит от{' '}
              <code className="font-mono text-white/70">provider</code>. Примеры:
            </p>
            {GENERATION_EXAMPLES.map((ex) => (
              <CodeBlock key={ex.label} label={ex.label} code={ex.body} />
            ))}
          </div>

          {ENDPOINT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3 pt-4">
              <h3 className="text-base font-semibold text-white/90">{group.title}</h3>
              <p className="text-sm text-white/40">{group.description}</p>
              <div className="space-y-2">
                {group.endpoints.map((ep) => (
                  <EndpointCard key={`${ep.method} ${ep.path}`} endpoint={ep} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* Pagination */}
        <Section id="pagination" title="Списки и пагинация" icon={ListOrdered}>
          <p className="text-sm text-white/50">
            Списки используют cursor-пагинацию. <span className="font-mono text-white/70">limit</span> по
            умолчанию 50, максимум 100. Сортировка{' '}
            <span className="font-mono text-white/70">created_at</span> или{' '}
            <span className="font-mono text-white/70">-created_at</span>. Фильтры —{' '}
            <span className="font-mono text-white/70">filter_&lt;поле&gt;</span>.
          </p>
          <CodeBlock label="Запрос" code={PAGINATION_EXAMPLE} />
          <p className="text-sm text-white/50">
            В ответе — <code className="font-mono text-white/70">meta.pagination</code> с полями{' '}
            <code className="font-mono text-white/70">limit</code>,{' '}
            <code className="font-mono text-white/70">next_cursor</code>,{' '}
            <code className="font-mono text-white/70">has_more</code>. Для следующей страницы передайте{' '}
            <code className="font-mono text-white/70">next_cursor</code> в параметре{' '}
            <code className="font-mono text-white/70">cursor</code>.
          </p>
        </Section>

        {/* Idempotency & limits */}
        <Section id="idempotency" title="Идемпотентность и лимиты" icon={Repeat}>
          <p className="text-sm text-white/50">
            Для <code className="font-mono text-white/70">POST</code>/<code className="font-mono text-white/70">DELETE</code>{' '}
            передайте заголовок <code className="font-mono text-white/70">Idempotency-Key</code> — повтор того же
            запроса с тем же ключом не создаст дубликат, а вернёт исходный ответ.
          </p>
          <p className="text-sm text-white/50">
            Действует ограничение частоты запросов по ключу. При превышении — статус{' '}
            <code className="font-mono text-white/70">429</code> с кодом{' '}
            <code className="font-mono text-white/70">rate_limited</code> и заголовками{' '}
            <code className="font-mono text-white/70">Retry-After</code>,{' '}
            <code className="font-mono text-white/70">X-RateLimit-*</code>.
          </p>
        </Section>

        {/* Tester */}
        <Section id="tester" title="Проверка подключения" icon={PlugZap}>
          <ConnectionTester />
        </Section>
      </div>

      <footer className="mt-16 pt-8 border-t border-white/5 text-sm text-white/40">
        Полная спецификация —{' '}
        <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          /api/v1/openapi.json
        </a>
        .
      </footer>
    </div>
  );
}
