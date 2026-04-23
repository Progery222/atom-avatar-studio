export const HEYGEN_RESOLUTIONS = [
  { value: '720p' as const, label: '720p' },
  { value: '1080p' as const, label: '1080p' },
  { value: '4k' as const, label: '4K' },
]

export const HEYGEN_ASPECT_RATIOS = [
  { value: '16:9' as const, label: '16:9 (Горизонтальный)' },
  { value: '9:16' as const, label: '9:16 (Вертикальный)' },
]

export const HEYGEN_VOICE_SPEED = {
  min: 0.5,
  max: 1.5,
  default: 1,
  step: 0.1,
}

export const HEYGEN_VOICE_PITCH = {
  min: -50,
  max: 50,
  default: 0,
  step: 1,
}

export const HEYGEN_LIMITS = {
  maxImageSizeMB: 50,
  maxAudioSizeMB: 50,
  maxAudioDurationMin: 10,
  maxScriptLength: 5000,
  maxConcurrentJobs: 10,
}

export const HEYGEN_PRICING = {
  per720p: 0.05,    // USD per second
  per1080p: 0.05,   // USD per second
  per4k: 0.0667,    // USD per second
}

export const HEYGEN_ERROR_MESSAGES: Record<string, string> = {
  insufficient_credit: 'Недостаточно средств на балансе HeyGen',
  rate_limit_exceeded: 'Превышен лимит запросов. Попробуйте позже',
  invalid_parameter: 'Неверные параметры запроса',
  unauthorized: 'Неверный API ключ HeyGen',
  video_not_found: 'Видео не найдено',
  voice_not_found: 'Голос не найден',
  asset_not_found: 'Файл не найден',
  trial_limit_exceeded: 'Превышен лимит пробного аккаунта HeyGen',
  internal_error: 'Внутренняя ошибка HeyGen. Попробуйте позже',
  quota_exceeded: 'Превышена квота использования',
}

export const HEYGEN_VOICE_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Russian',
  'Japanese',
  'Korean',
  'Chinese',
  'Italian',
  'Dutch',
  'Polish',
  'Arabic',
  'Hindi',
  'Turkish',
]

export const HEYGEN_VOICE_GENDERS = [
  { value: 'male' as const, label: 'Мужской' },
  { value: 'female' as const, label: 'Женский' },
]

export const HEYGEN_DEFAULTS = {
  resolution: '1080p' as const,
  aspectRatio: '16:9' as const,
  voiceSpeed: 1,
  voicePitch: 0,
  removeBackground: false,
  expressiveness: 'low' as const,
  motionPrompt: '',
}

export const HEYGEN_EXPRESSIVENESS_LEVELS = [
  { value: 'low' as const, label: 'Низкая', description: 'Спокойная, сдержанная мимика' },
  { value: 'medium' as const, label: 'Средняя', description: 'Умеренная экспрессия' },
  { value: 'high' as const, label: 'Высокая', description: 'Яркая, эмоциональная мимика' },
]

export const HEYGEN_MOTION_PROMPTS = [
  { value: '', label: 'Без движения', description: 'Статичное изображение' },
  { value: 'slight head tilt', label: 'Наклон головы', description: 'Легкий наклон головы в сторону' },
  { value: 'nodding gently', label: 'Кивать', description: 'Плавное кивание головой' },
  { value: 'shaking head slightly', label: 'Качать головой', description: 'Легкое покачивание головой' },
  { value: 'looking to the side', label: 'Смотреть в сторону', description: 'Повернуть голову в сторону' },
  { value: 'subtle smile', label: 'Улыбка', description: 'Легкая улыбка' },
  { value: 'raised eyebrows', label: 'Поднять брови', description: 'Удивленное выражение' },
  { value: 'gesturing with hands while presenting', label: 'Жестикулировать', description: 'Показывать жесты руками' },
  { value: 'turning slightly', label: 'Повернуться', description: 'Небольшой поворот тела' },
  { value: 'breathing motion', label: 'Дыхание', description: 'Имитация дыхания' },
]
