import type { EndpointDef } from '@/components/api-docs/endpoint-card';

export interface EndpointGroup {
  title: string;
  description: string;
  endpoints: EndpointDef[];
}

const META_RESPONSE = `{
  "success": true,
  "data": {
    "service": "atom-avatar-studio",
    "api_version": "v1",
    "capabilities": ["generations.video.seedance", "generations.image.gpt-image", "..."],
    "documentation_url": "/api/v1/openapi.json"
  },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`;

const GENERATION_RESPONSE = `{
  "success": true,
  "data": {
    "id": "gen_...",
    "kind": "video",
    "provider": "seedance",
    "model": "bytedance/seedance-2-fast",
    "status": "queued",
    "result": null,
    "error": null,
    "created_at": "2026-06-05T12:00:00.000Z",
    "updated_at": "2026-06-05T12:00:00.000Z"
  },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`;

export const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    title: 'Система',
    description: 'Служебные эндпоинты для проверки доступности и метаданных.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/health',
        scope: 'public',
        summary: 'Проверка доступности сервиса. Не требует ключа.',
        response: `{
  "success": true,
  "data": { "status": "ok", "timestamp": "2026-06-05T12:00:00.000Z" },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/meta',
        scope: 'read',
        summary: 'Информация о сервисе: список возможностей (capabilities) и ссылка на OpenAPI.',
        response: META_RESPONSE,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/verify',
        scope: 'read',
        summary: 'Проверка API-ключа. Возвращает его идентификатор, права (scopes) и срок действия.',
        response: `{
  "success": true,
  "data": { "valid": true, "key_id": "key_...", "scopes": ["read", "write"], "expires_at": null },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/openapi.json',
        scope: 'public',
        summary: 'Машиночитаемая спецификация OpenAPI 3 для всех эндпоинтов. Не требует ключа.',
      },
    ],
  },
  {
    title: 'Генерации (generations)',
    description:
      'Единый ресурс для всех типов генерации: видео (Seedance, Kling, HeyGen), изображений (GPT-Image) и озвучки (TTS). Видео и изображения — асинхронные (создать → опрашивать статус), озвучка завершается сразу.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/generations',
        scope: 'write',
        summary:
          'Создать генерацию. Тело зависит от provider (см. примеры ниже). Поддерживает заголовок Idempotency-Key. Видео/изображение → 202 queued, озвучка → 200 succeeded.',
        request: `{
  "provider": "seedance",
  "image_url": "https://example.com/face.jpg",
  "spoken_text": "Привет!",
  "resolution": "720p",
  "aspect_ratio": "16:9"
}`,
        response: GENERATION_RESPONSE,
      },
      {
        method: 'GET',
        path: '/api/v1/generations',
        scope: 'read',
        summary:
          'Список генераций с cursor-пагинацией. Параметры: limit (по умолчанию 50, максимум 100), cursor, sort, filter_status, filter_kind.',
        response: `{
  "success": true,
  "data": [ { "id": "gen_...", "status": "succeeded", "kind": "video", "...": "..." } ],
  "meta": {
    "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1",
    "pagination": { "limit": 50, "next_cursor": null, "has_more": false }
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/generations/{id}',
        scope: 'read',
        summary:
          'Получить генерацию по id. Если она ещё не завершена — сервис сам опросит провайдера и обновит статус и результат (video_url / image_urls / audio_url).',
        response: GENERATION_RESPONSE,
      },
      {
        method: 'DELETE',
        path: '/api/v1/generations/{id}',
        scope: 'write',
        summary: 'Отменить/удалить генерацию (best effort): помечает запись canceled и останавливает опрос.',
      },
    ],
  },
  {
    title: 'Действия (actions)',
    description: 'Операции, не являющиеся CRUD над ресурсом.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/actions/upload',
        scope: 'write',
        summary:
          'Загрузить входной файл (картинку/аудио) в хранилище и получить URL для использования в генерации. Принимает удалённый URL или base64.',
        request: `// Вариант 1 — по URL:
{ "source": "url", "url": "https://example.com/face.jpg", "kind": "image" }

// Вариант 2 — base64:
{ "source": "base64", "data": "<base64>", "content_type": "image/png", "kind": "image" }`,
        response: `{
  "success": true,
  "data": { "url": "https://.../api/files/uploads/...", "content_type": "image/png", "bytes": 12345 },
  "meta": { "request_id": "req_...", "service": "atom-avatar-studio", "api_version": "v1" }
}`,
      },
    ],
  },
  {
    title: 'Каталоги (catalog)',
    description: 'Справочные данные: доступные модели, голоса и пресеты.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/catalog/models',
        scope: 'read',
        summary: 'Список доступных моделей генерации с их возможностями (разрешения, форматы кадра).',
      },
      {
        method: 'GET',
        path: '/api/v1/catalog/voices?provider=',
        scope: 'read',
        summary: 'Голоса для провайдера TTS/аватара. provider: heygen | gemini-flash | openai | elevenlabs.',
      },
      {
        method: 'GET',
        path: '/api/v1/catalog/presets',
        scope: 'read',
        summary: 'Пресеты Seedance: эмоции, движения камеры, освещение.',
      },
    ],
  },
  {
    title: 'Аккаунт (account)',
    description: 'Балансы провайдерских аккаунтов.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/account/credits?provider=',
        scope: 'read',
        summary: 'Остатки кредитов. provider: kie | gpt-image | heygen. Без параметра — все провайдеры сразу.',
      },
    ],
  },
];

export interface GenerationExample {
  label: string;
  body: string;
}

export const GENERATION_EXAMPLES: GenerationExample[] = [
  {
    label: 'Видео — Seedance (встроенная озвучка)',
    body: `{
  "provider": "seedance",
  "image_url": "https://example.com/face.jpg",
  "spoken_text": "Привет, это сгенерированный аватар!",
  "emotion": "joyful",
  "resolution": "720p",
  "aspect_ratio": "16:9"
}`,
  },
  {
    label: 'Видео — Kling (внешнее аудио или авто-TTS)',
    body: `{
  "provider": "kling",
  "model": "kling/ai-avatar-pro",
  "image_url": "https://example.com/face.jpg",
  "spoken_text": "Текст для озвучки",
  "tts": { "provider": "gemini-flash", "voice_name": "Kore", "language_code": "ru-RU" }
}`,
  },
  {
    label: 'Видео — HeyGen',
    body: `{
  "provider": "heygen",
  "source_type": "image",
  "image_url": "https://example.com/face.jpg",
  "script": "Текст для озвучки",
  "voice_id": "<heygen_voice_id>",
  "resolution": "720p",
  "aspect_ratio": "16:9"
}`,
  },
  {
    label: 'Изображение — GPT-Image',
    body: `{
  "provider": "gpt-image",
  "mode": "text-to-image",
  "prompt": "Портрет человека в студийном свете",
  "aspect_ratio": "1:1",
  "resolution": "2K"
}`,
  },
  {
    label: 'Озвучка — TTS (синхронно)',
    body: `{
  "provider": "gemini-flash",
  "text": "Текст для озвучки",
  "voice_name": "Kore",
  "language_code": "ru-RU"
}`,
  },
];

export interface ErrorCodeRow {
  http: number;
  code: string;
  when: string;
}

export const ERROR_CODES: ErrorCodeRow[] = [
  { http: 400, code: 'bad_request', when: 'Некорректный запрос или невалидный JSON.' },
  { http: 401, code: 'unauthorized', when: 'Ключ отсутствует или неверный.' },
  { http: 403, code: 'forbidden', when: 'Ключ валиден, но прав (scope) недостаточно.' },
  { http: 404, code: 'not_found', when: 'Ресурс не найден.' },
  { http: 409, code: 'conflict', when: 'Конфликт состояния (например, повтор Idempotency-Key в процессе).' },
  { http: 422, code: 'validation_error', when: 'Ошибка валидации тела запроса (детали в error.details).' },
  { http: 429, code: 'rate_limited', when: 'Превышен лимит запросов. См. заголовок Retry-After.' },
  { http: 500, code: 'internal_error', when: 'Внутренняя ошибка сервера.' },
];
