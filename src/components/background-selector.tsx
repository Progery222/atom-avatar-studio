'use client'

import type { HeyGenBackground } from '@/types/heygen'

type BackgroundMode = 'none' | 'color' | 'image'

interface BackgroundConfig {
  mode: BackgroundMode
  colorValue: string
  imageUrl: string
}

interface BackgroundSelectorProps {
  removeBackground: boolean
  onRemoveBackgroundChange: (value: boolean) => void
  backgroundConfig: BackgroundConfig
  onBackgroundConfigChange: (config: BackgroundConfig) => void
}

export function getBackgroundPayload(
  removeBackground: boolean,
  config: BackgroundConfig
): { remove_background?: boolean; background?: HeyGenBackground } {
  const result: { remove_background?: boolean; background?: HeyGenBackground } = {}
  
  if (removeBackground) {
    result.remove_background = true
  }
  
  if (config.mode === 'color' && config.colorValue) {
    result.background = { type: 'color', value: config.colorValue }
  } else if (config.mode === 'image' && config.imageUrl) {
    result.background = { type: 'image', url: config.imageUrl }
  }
  
  return result
}

const BG_MODES: { value: BackgroundMode; label: string; icon: string }[] = [
  { value: 'none', label: 'Нет', icon: '✕' },
  { value: 'color', label: 'Цвет', icon: '🎨' },
  { value: 'image', label: 'Изображение', icon: '🖼️' },
]

export default function BackgroundSelector({
  removeBackground,
  onRemoveBackgroundChange,
  backgroundConfig,
  onBackgroundConfigChange,
}: BackgroundSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Remove background toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={removeBackground}
          onChange={(e) => onRemoveBackgroundChange(e.target.checked)}
          className="w-4 h-4 accent-purple-500"
          data-testid="remove-bg-checkbox"
        />
        <span className="text-sm text-zinc-300">Удалить фон</span>
      </label>

      {/* Background mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {BG_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onBackgroundConfigChange({ ...backgroundConfig, mode: mode.value })}
            className={`glass-panel p-2.5 rounded-lg text-center transition-all ${
              backgroundConfig.mode === mode.value
                ? 'ring-2 ring-purple-500 bg-purple-500/10'
                : 'hover:bg-white/5'
            }`}
            data-testid="bg-mode"
          >
            <div className="text-lg mb-0.5">{mode.icon}</div>
            <div className="text-xs text-zinc-300">{mode.label}</div>
          </button>
        ))}
      </div>

      {/* Color picker */}
      {backgroundConfig.mode === 'color' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundConfig.colorValue || '#000000'}
            onChange={(e) => onBackgroundConfigChange({ ...backgroundConfig, colorValue: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border border-white/10"
          />
          <span className="text-sm text-zinc-400">{backgroundConfig.colorValue || '#000000'}</span>
        </div>
      )}

      {/* Image URL input */}
      {backgroundConfig.mode === 'image' && (
        <input
          type="url"
          value={backgroundConfig.imageUrl}
          onChange={(e) => onBackgroundConfigChange({ ...backgroundConfig, imageUrl: e.target.value })}
          placeholder="https://example.com/background.jpg"
          className="glass-input w-full px-3 py-2 rounded-lg text-sm"
          data-testid="bg-image-url"
        />
      )}
    </div>
  )
}