export const GPT_IMAGE_ASPECT_RATIOS = [
  { value: 'auto' as const, label: 'Авто' },
  { value: '1:1' as const, label: '1:1 (Квадрат)' },
  { value: '9:16' as const, label: '9:16 (Вертикальный)' },
  { value: '16:9' as const, label: '16:9 (Горизонтальный)' },
  { value: '4:3' as const, label: '4:3 (Горизонтальный)' },
  { value: '3:4' as const, label: '3:4 (Вертикальный)' },
]

export const GPT_IMAGE_RESOLUTIONS = [
  { value: '1K' as const, label: '1K', pixelSize: '1024 x 1024' },
  { value: '2K' as const, label: '2K', pixelSize: '2048 x 2048' },
  { value: '4K' as const, label: '4K (Экспериментальный)', pixelSize: '4096 x 4096' },
]

export const GPT_IMAGE_PRICING: Record<string, number> = {
  '1K': 2,
  '2K': 3,
  '4K': 5,
}

export const GPT_IMAGE_CONSTRAINTS = {
  invalidCombos: [{ aspectRatio: '1:1' as const, resolution: '4K' as const }],
  autoResolutionLimit: '1K' as const,
}

export const GPT_IMAGE_MODELS: Record<string, string> = {
  'text-to-image': 'gpt-image-2-text-to-image',
  'image-to-image': 'gpt-image-2-image-to-image',
}

export const GPT_IMAGE_DEFAULTS = {
  aspectRatio: 'auto' as const,
  resolution: '1K' as const,
}

export const GPT_IMAGE_LIMITS = {
  maxPromptLength: 20000,
  maxInputUrls: 16,
}

export const GPT_IMAGE_ERROR_MESSAGES: Record<string, string> = {
  '401': 'Неверный API ключ. Проверьте настройки авторизации',
  '402': 'Недостаточно кредитов для генерации изображения',
  '429': 'Превышен лимит запросов. Попробуйте позже',
  '500': 'Внутренняя ошибка сервера. Попробуйте позже',
  '501': 'Функция не реализована на сервере',
  '505': 'Ошибка генерации изображения. Попробуйте изменить параметры',
}
