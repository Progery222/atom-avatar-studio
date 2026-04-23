// v3 API: Image input for CreateVideoFromImage
export type HeyGenImageInput =
  | { type: 'url'; url: string }
  | { type: 'asset_id'; asset_id: string }
  | { type: 'base64'; media_type: string; data: string }

// v3 API: Voice settings (applies only to script+voice_id, not audio_url)
export interface HeyGenVoiceSettings {
  speed?: number       // 0.5 - 1.5, default 1
  pitch?: number       // -50 to +50, default 0
  volume?: number      // 0.0 - 1.0, default 1
  locale?: string      // e.g. 'en-US'
  engine_settings?: HeyGenEngineSettings
}

// v3 API: Engine-specific voice settings (discriminated union)
export type HeyGenEngineSettings =
  | { engine_type: 'elevenlabs'; model?: string; stability?: number; similarity_boost?: number; style?: number; use_speaker_boost?: boolean }
  | { engine_type: 'fish'; model?: string; stability?: number; similarity?: number }
  | { engine_type: 'starfish' }

// v3 API: Background setting
export interface HeyGenBackground {
  type: 'color' | 'image'
  value?: string        // hex color (required when type='color')
  url?: string          // image URL (for type='image', mutually exclusive with asset_id)
  asset_id?: string     // asset ID (for type='image', mutually exclusive with url)
}

// v3 API: Output format
export type HeyGenOutputFormat = 'mp4' | 'webm'

// v3 API: Create Video request body (discriminated by type)
export type HeyGenCreateVideoRequest =
  | HeyGenCreateVideoFromImage
  | HeyGenCreateVideoFromAvatar

export interface HeyGenCreateVideoFromImage {
  type: 'image'
  image: HeyGenImageInput
  script?: string
  voice_id?: string
  audio_url?: string
  audio_asset_id?: string
  title?: string
  resolution?: '720p' | '1080p' | '4k'
  aspect_ratio?: '16:9' | '9:16'
  remove_background?: boolean
  background?: HeyGenBackground
  voice_settings?: HeyGenVoiceSettings
  motion_prompt?: string
  expressiveness?: 'high' | 'medium' | 'low'
  output_format?: HeyGenOutputFormat
  callback_url?: string
  callback_id?: string
}

export interface HeyGenCreateVideoFromAvatar {
  type: 'avatar'
  avatar_id: string
  script?: string
  voice_id?: string
  audio_url?: string
  audio_asset_id?: string
  title?: string
  resolution?: '720p' | '1080p' | '4k'
  aspect_ratio?: '16:9' | '9:16'
  remove_background?: boolean
  background?: HeyGenBackground
  voice_settings?: HeyGenVoiceSettings
  motion_prompt?: string            // Photo avatars only
  expressiveness?: 'high' | 'medium' | 'low'  // Photo avatars only
  output_format?: HeyGenOutputFormat
  callback_url?: string
  callback_id?: string
}

// v3 API: Create Video response
export interface HeyGenCreateVideoResponse {
  data: {
    video_id: string
    status: string
    output_format?: HeyGenOutputFormat
  }
}

// v3 API: Video status response (GET /v3/videos/{video_id})
export interface HeyGenVideoStatus {
  data: {
    id: string
    title?: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    video_url?: string | null
    thumbnail_url?: string | null
    gif_url?: string | null
    captioned_video_url?: string | null
    subtitle_url?: string | null
    duration?: number | null
    created_at?: number | null
    completed_at?: number | null
    folder_id?: string | null
    output_language?: string | null
    failure_code?: string | null
    failure_message?: string | null
    video_page_url?: string | null
  }
}

export interface HeyGenVoice {
  voice_id: string
  name: string
  language: string
  gender: 'male' | 'female'
  preview_audio_url?: string
}

export interface HeyGenVoicesResponse {
  data: HeyGenVoice[]
  has_more?: boolean
  next_token?: string
}

export interface HeyGenBalanceResponse {
  data: {
    billing_type: 'wallet' | 'subscription' | 'usage_based'
    wallet?: {
      remaining_balance: number
      currency: string
    }
    subscription?: {
      remaining: number
      total: number
    }
  }
}

export interface HeyGenError {
  error: {
    code: string
    message: string
  }
}
