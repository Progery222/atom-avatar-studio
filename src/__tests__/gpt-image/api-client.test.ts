import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createGptImageTask,
  pollGptImageTask,
  getGptImageCredits,
  GptImageApiError,
} from '@/lib/gpt-image'

describe('createGptImageTask', () => {
  beforeEach(() => {
    vi.stubEnv('KIE_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns taskId for text-to-image mode', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_abc123' } }),
    } as unknown as Response)

    const result = await createGptImageTask('text-to-image', { prompt: 'test prompt' })
    expect(result.data.taskId).toBe('task_abc123')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.kie.ai/api/v1/jobs/createTask',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('gpt-image-2-text-to-image'),
      })
    )
  })

  it('returns taskId for image-to-image mode with inputUrls', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_xyz789' } }),
    } as unknown as Response)

    const result = await createGptImageTask('image-to-image', {
      prompt: 'test prompt',
      inputUrls: ['http://example.com/image.png'],
    })
    expect(result.data.taskId).toBe('task_xyz789')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.kie.ai/api/v1/jobs/createTask',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('gpt-image-2-image-to-image'),
      })
    )
  })

  it('throws GptImageApiError on 401 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response)

    await expect(createGptImageTask('text-to-image', { prompt: 'test' })).rejects.toThrow(
      GptImageApiError
    )
  })

  it('throws GptImageApiError on 402 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () => 'Payment Required',
    } as unknown as Response)

    await expect(createGptImageTask('text-to-image', { prompt: 'test' })).rejects.toThrow(
      GptImageApiError
    )
  })

  it('throws GptImageApiError on 500 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response)

    await expect(createGptImageTask('text-to-image', { prompt: 'test' })).rejects.toThrow(
      GptImageApiError
    )
  })
})

describe('pollGptImageTask', () => {
  beforeEach(() => {
    vi.stubEnv('KIE_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns state and resultUrls on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 200,
          msg: 'success',
          data: {
            state: 'success',
            resultJson: JSON.stringify({ resultUrls: ['http://example.com/result.png'] }),
            progress: 100,
          },
        }),
    } as unknown as Response)

    const result = await pollGptImageTask('task_123')
    expect(result.state).toBe('success')
    expect(result.resultUrls).toEqual(['http://example.com/result.png'])
    expect(result.progress).toBe(100)
  })

  it('returns fail state with failCode and failMsg on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 200,
          msg: 'success',
          data: {
            state: 'fail',
            failCode: 'E001',
            failMsg: 'Generation failed',
          },
        }),
    } as unknown as Response)

    const result = await pollGptImageTask('task_123')
    expect(result.state).toBe('fail')
    expect(result.failCode).toBe('E001')
    expect(result.failMsg).toBe('Generation failed')
  })
})

describe('getGptImageCredits', () => {
  beforeEach(() => {
    vi.stubEnv('KIE_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns credit balance', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ code: 200, msg: 'success', data: 42 }),
    } as unknown as Response)

    const result = await getGptImageCredits()
    expect(result.data).toBe(42)
  })
})
