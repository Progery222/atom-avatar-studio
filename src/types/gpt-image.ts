export type GptImageAspectRatio = 'auto' | '1:1' | '9:16' | '16:9' | '4:3' | '3:4'

export type GptImageResolution = '1K' | '2K' | '4K'

export type GptImageGenerationMode = 'text-to-image' | 'image-to-image'

export interface GptImageGenerateRequest {
  mode: GptImageGenerationMode
  prompt: string
  aspectRatio?: GptImageAspectRatio
  resolution?: GptImageResolution
  inputUrls?: string[]
}

export interface GptImageTaskResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

export type GptImageTaskStatus = 'waiting' | 'queuing' | 'generating' | 'success' | 'fail'

export interface GptImageResult {
  state: GptImageTaskStatus
  resultUrls?: string[]
  failCode?: string
  failMsg?: string
  progress?: number
}

export interface GptImageCreditsResponse {
  code: number
  msg: string
  data: number
}
