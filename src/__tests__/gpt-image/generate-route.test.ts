import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/gpt-image/generate/route'
import { createGptImageTask } from '@/lib/gpt-image'

vi.mock('@/lib/gpt-image', () => ({
  createGptImageTask: vi.fn(),
  GptImageApiError: class extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/gpt-image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/gpt-image/generate', () => {
  beforeEach(() => {
    vi.stubEnv('KIE_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns 400 when prompt is missing', async () => {
    const request = createRequest({ mode: 'text-to-image' })
    const response = await POST(request as unknown as import('next/server').NextRequest)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('prompt is required')
  })

  it('returns 400 when mode is invalid', async () => {
    const request = createRequest({ mode: 'invalid-mode', prompt: 'test' })
    const response = await POST(request as unknown as import('next/server').NextRequest)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('mode is required')
  })

  it('returns 400 for 1:1 + 4K combination', async () => {
    const request = createRequest({
      mode: 'text-to-image',
      prompt: 'test',
      aspectRatio: '1:1',
      resolution: '4K',
    })
    const response = await POST(request as unknown as import('next/server').NextRequest)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('1:1')
  })

  it('returns 400 for auto + 2K combination', async () => {
    const request = createRequest({
      mode: 'text-to-image',
      prompt: 'test',
      aspectRatio: 'auto',
      resolution: '2K',
    })
    const response = await POST(request as unknown as import('next/server').NextRequest)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Автоматическое')
  })

  it('returns success with taskId for valid request', async () => {
    vi.mocked(createGptImageTask).mockResolvedValue({
      code: 200,
      msg: 'success',
      data: { taskId: 'task_valid123' },
    })

    const request = createRequest({
      mode: 'text-to-image',
      prompt: 'test prompt',
      aspectRatio: '16:9',
      resolution: '2K',
    })
    const response = await POST(request as unknown as import('next/server').NextRequest)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.taskId).toBe('task_valid123')
  })
})
