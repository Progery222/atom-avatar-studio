import type {
  GptImageCreditsResponse,
  GptImageGenerateRequest,
  GptImageResult,
  GptImageTaskResponse,
} from '@/types/gpt-image'

const KIE_BASE_URL = 'https://api.kie.ai/api/v1'

export class GptImageApiError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'GptImageApiError'
    this.code = code
  }
}

function getApiKey(): string {
  const key = process.env.KIE_API_KEY
  if (!key) {
    throw new Error('KIE_API_KEY is not set')
  }
  return key
}

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function getErrorDetails(body: unknown): { code: string; message: string } {
  if (typeof body === 'object' && body !== null) {
    const code = (body as { code?: unknown }).code
    const msg = (body as { msg?: unknown }).msg

    if (typeof code === 'number' || typeof code === 'string') {
      return {
        code: String(code),
        message: typeof msg === 'string' ? msg : 'Unknown error',
      }
    }
  }

  return {
    code: 'internal_error',
    message: 'Unknown error',
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await parseJson(response)

  if (!response.ok) {
    const { code, message } = getErrorDetails(body)
    throw new GptImageApiError(message, code)
  }

  if (typeof body === 'object' && body !== null) {
    const responseCode = (body as { code?: unknown }).code
    if (typeof responseCode === 'number' && responseCode !== 200) {
      const { code, message } = getErrorDetails(body)
      throw new GptImageApiError(message, code)
    }
  }

  return body as T
}

export async function createGptImageTask(
  mode: GptImageGenerateRequest['mode'],
  params: Omit<GptImageGenerateRequest, 'mode'>
): Promise<GptImageTaskResponse> {
  const model =
    mode === 'text-to-image'
      ? 'gpt-image-2-text-to-image'
      : 'gpt-image-2-image-to-image'

  const body = {
    model,
    input: {
      prompt: params.prompt,
      ...(params.aspectRatio && { aspect_ratio: params.aspectRatio }),
      ...(params.resolution && { resolution: params.resolution }),
      ...(params.inputUrls && params.inputUrls.length > 0 && { input_urls: params.inputUrls }),
    },
  }

  const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[GPT Image] POST /jobs/createTask failed:', response.status, text)
    throw new GptImageApiError(
      `HTTP ${response.status}: ${text.slice(0, 200)}`,
      `http_${response.status}`
    )
  }

  return handleResponse<GptImageTaskResponse>(response)
}

export async function pollGptImageTask(taskId: string): Promise<GptImageResult> {
  const response = await fetch(
    `${KIE_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  const data = await handleResponse<{
    code: number
    msg: string
    data: {
      state: string
      resultJson?: string
      failCode?: string
      failMsg?: string
      progress?: number
    }
  }>(response)

  const record = data.data
  let resultUrls: string[] | undefined

  if (record.resultJson) {
    try {
      const parsed = JSON.parse(record.resultJson) as { resultUrls?: string[] }
      resultUrls = parsed.resultUrls
    } catch {
      // ignore invalid JSON
    }
  }

  return {
    state: record.state as GptImageResult['state'],
    resultUrls,
    failCode: record.failCode,
    failMsg: record.failMsg,
    progress: record.progress,
  }
}

export async function getGptImageCredits(): Promise<GptImageCreditsResponse> {
  const response = await fetch(`${KIE_BASE_URL}/chat/credit`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse<GptImageCreditsResponse>(response)
}
