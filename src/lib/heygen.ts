import type {
  HeyGenBalanceResponse,
  HeyGenCreateVideoRequest,
  HeyGenCreateVideoResponse,
  HeyGenVideoStatus,
  HeyGenVoice,
  HeyGenVoicesResponse,
} from '@/types/heygen'

const HEYGEN_BASE_URL = 'https://api.heygen.com'

export class HeyGenApiError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'HeyGenApiError'
    this.code = code
  }
}

function getApiKey(): string {
  const key = process.env.HEYGEN_API_KEY
  if (!key) {
    throw new Error('HEYGEN_API_KEY is not set')
  }
  return key
}

function getHeaders(): HeadersInit {
  return {
    'x-api-key': getApiKey(),
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
    const error = (body as { error?: unknown }).error
    if (typeof error === 'object' && error !== null) {
      const code = (error as { code?: unknown }).code
      const message = (error as { message?: unknown }).message

      return {
        code: typeof code === 'string' ? code : 'internal_error',
        message: typeof message === 'string' ? message : 'Unknown error',
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
    throw new HeyGenApiError(message, code)
  }

  return body as T
}

export async function createVideo(
  params: HeyGenCreateVideoRequest
): Promise<HeyGenCreateVideoResponse> {
  console.log('[HeyGen] POST /v3/videos — payload keys:', Object.keys(params).join(', '))

  const response = await fetch(`${HEYGEN_BASE_URL}/v3/videos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[HeyGen] POST /v3/videos failed:', response.status, text)
    throw new HeyGenApiError(`HTTP ${response.status}: ${text.slice(0, 200)}`, `http_${response.status}`)
  }

  return handleResponse<HeyGenCreateVideoResponse>(response)
}

export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const response = await fetch(`${HEYGEN_BASE_URL}/v3/videos/${videoId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse<HeyGenVideoStatus>(response)
}

export async function listVoices(params?: {
  gender?: string
  language?: string
  limit?: number
}): Promise<HeyGenVoice[]> {
  const searchParams = new URLSearchParams()

  if (params?.gender) {
    searchParams.set('gender', params.gender)
  }

  if (params?.language) {
    searchParams.set('language', params.language)
  }

  searchParams.set('limit', String(params?.limit ?? 100))

  const response = await fetch(
    `${HEYGEN_BASE_URL}/v3/voices?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  const data = await handleResponse<HeyGenVoicesResponse>(response)
  return data.data
}

export async function getBalance(): Promise<HeyGenBalanceResponse['data']> {
  const response = await fetch(`${HEYGEN_BASE_URL}/v3/users/me`, {
    method: 'GET',
    headers: getHeaders(),
  })

  const data = await handleResponse<HeyGenBalanceResponse>(response)
  return data.data
}
