'use client'

import { useState, useRef } from 'react'
import { Upload, Mic, FileAudio, Play, Loader2, Download, Video } from 'lucide-react'
import { uploadFileToSupabase } from '@/lib/supabase'
import { historyService } from '@/lib/history-service'
import VoiceSelector from '@/components/voice-selector'
import BackgroundSelector, { getBackgroundPayload } from '@/components/background-selector'
import {
  HEYGEN_LIMITS,
  HEYGEN_PRICING,
  HEYGEN_DEFAULTS,
  HEYGEN_RESOLUTIONS,
  HEYGEN_ASPECT_RATIOS,
  HEYGEN_VOICE_SPEED,
  HEYGEN_VOICE_PITCH,
  HEYGEN_EXPRESSIVENESS_LEVELS,
  HEYGEN_MOTION_PROMPTS,
} from '@/constants/heygen'

type AudioMode = 'text' | 'file'
type BackgroundMode = 'none' | 'color' | 'image'
type SourceType = 'image' | 'avatar'

interface BackgroundConfig {
  mode: BackgroundMode
  colorValue: string
  imageUrl: string
}

export default function HeyGenTab() {
  // Source type toggle: 'image' (Image-to-Video) or 'avatar' (Photo Avatar)
  const [sourceType, setSourceType] = useState<SourceType>('image')

  // Image state (for Image-to-Video)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avatar ID state (for Photo Avatar)
  const [avatarId, setAvatarId] = useState<string>('')

  // Audio state
  const [audioMode, setAudioMode] = useState<AudioMode>('text')
  const [script, setScript] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Voice tuning
  const [voiceSpeed, setVoiceSpeed] = useState(HEYGEN_DEFAULTS.voiceSpeed)
  const [voicePitch, setVoicePitch] = useState(HEYGEN_DEFAULTS.voicePitch)

  // Video settings
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>(HEYGEN_DEFAULTS.resolution)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(HEYGEN_DEFAULTS.aspectRatio)

  // Background
  const [removeBackground, setRemoveBackground] = useState(HEYGEN_DEFAULTS.removeBackground)
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    mode: 'none',
    colorValue: '#000000',
    imageUrl: '',
  })

  // Photo Avatar motion & expressiveness
  const [expressiveness, setExpressiveness] = useState<'high' | 'medium' | 'low'>(HEYGEN_DEFAULTS.expressiveness)
  const [motionPrompt, setMotionPrompt] = useState(HEYGEN_DEFAULTS.motionPrompt)
  const [customMotionPrompt, setCustomMotionPrompt] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [stepText, setStepText] = useState('')
  const [videoResult, setVideoResult] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [actualCost, setActualCost] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > HEYGEN_LIMITS.maxImageSizeMB * 1024 * 1024) {
      alert(`Максимальный размер изображения: ${HEYGEN_LIMITS.maxImageSizeMB}МБ`)
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Поддерживаемые форматы: JPG, PNG')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > HEYGEN_LIMITS.maxAudioSizeMB * 1024 * 1024) {
      alert(`Максимальный размер аудио: ${HEYGEN_LIMITS.maxAudioSizeMB}МБ`)
      return
    }
    if (!['audio/mpeg', 'audio/wav', 'audio/mp3'].includes(file.type)) {
      alert('Поддерживаемые форматы: MP3, WAV')
      return
    }

    setAudioFile(file)
  }

  const pollVideoStatus = (videoId: string, historyId: string) => {
    setStepText('Рендеринг видео...')
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/heygen/status?videoId=${videoId}`)
        const result = await res.json()

        if (result.success && result.data) {
          const { status, video_url, failure_message } = result.data

          if (status === 'completed' && video_url) {
            clearInterval(interval)
            if (timerRef.current) clearInterval(timerRef.current)
            setVideoResult(video_url)
            setIsGenerating(false)

            historyService.updateItem(historyId, {
              status: 'success',
              resultVideoUrl: video_url,
            })

            const pricingKey = resolution === '4k' ? 'per4k' : 'per1080p'
            setActualCost(HEYGEN_PRICING[pricingKey])
          } else if (status === 'failed') {
            clearInterval(interval)
            if (timerRef.current) clearInterval(timerRef.current)
            setIsGenerating(false)

            historyService.updateItem(historyId, { status: 'fail' })
            alert(`Ошибка генерации: ${failure_message ?? 'Неизвестная ошибка'}`)
          }
        }
      } catch {
        // continue polling on network error
      }
    }, 5000)
  }

  const getEstimatedCost = () => {
    const pricingKey = resolution === '4k' ? 'per4k' : 'per1080p'
    return HEYGEN_PRICING[pricingKey]
  }

const handleGenerate = async () => {
    // Validation based on source type
    if (sourceType === 'image') {
      if (!imageFile) {
        alert('Пожалуйста, загрузите изображение.')
        return
      }
    } else {
      if (!avatarId.trim()) {
        alert('Пожалуйста, введите ID аватара из HeyGen.')
        return
      }
    }

    if (audioMode === 'text' && !script.trim()) {
      alert('Пожалуйста, введите текст для озвучки.')
      return
    }
    if (audioMode === 'text' && !selectedVoiceId) {
      alert('Пожалуйста, выберите голос.')
      return
    }
    if (audioMode === 'file' && !audioFile) {
      alert('Пожалуйста, загрузите аудиофайл.')
      return
    }

    try {
      setIsGenerating(true)
      setStepText(sourceType === 'image' ? 'Загрузка изображения...' : 'Подготовка аватара...')
      setVideoResult(null)
      setActualCost(null)
      setTimer(0)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setTimer(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 5000)

      let imageUrl: string | undefined
      if (sourceType === 'image' && imageFile) {
        imageUrl = await uploadFileToSupabase('media', `heygen_avatar_${Date.now()}.jpg`, imageFile)
      }

      let audioUrl: string | undefined
      if (audioMode === 'file' && audioFile) {
        setStepText('Загрузка аудио...')
        audioUrl = await uploadFileToSupabase('media', `heygen_audio_${Date.now()}.mp3`, audioFile)
      }

      setStepText('Создание видео...')

      const bgPayload = sourceType === 'image' ? getBackgroundPayload(removeBackground, backgroundConfig) : {}

      const generateRes = await fetch('/api/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          imageUrl,
          avatarId: sourceType === 'avatar' ? avatarId : undefined,
          script: audioMode === 'text' ? script : undefined,
          voiceId: audioMode === 'text' ? selectedVoiceId : undefined,
          audioUrl,
          resolution,
          aspectRatio,
          voiceSettings: audioMode === 'text' ? { speed: voiceSpeed, pitch: voicePitch } : undefined,
          expressiveness: sourceType === 'avatar' ? expressiveness : undefined,
          motionPrompt: sourceType === 'avatar' ? (motionPrompt || customMotionPrompt || undefined) : undefined,
          ...bgPayload,
        }),
      })

      const generateData = await generateRes.json()
      if (!generateData.success) throw new Error(generateData.error)

      const videoId = generateData.videoId

      historyService.addItem({
        id: videoId,
        timestamp: Date.now(),
        modelId: 'heygen/image-to-video',
        modelName: 'HeyGen',
        provider: 'heygen',
        status: 'pending',
        cost: null,
        inputImageUrl: imageUrl,
        params: {
          emotion: '',
          camera: '',
          resolution,
          aspectRatio,
          duration: 0,
          voiceName: selectedVoiceName,
          removeBackground,
          backgroundType: backgroundConfig.mode,
          backgroundValue: backgroundConfig.mode === 'color' ? backgroundConfig.colorValue : backgroundConfig.imageUrl,
          voiceSpeed,
          voicePitch,
          expressiveness,
          motionPrompt: motionPrompt || customMotionPrompt,
        },
      })

      pollVideoStatus(videoId, videoId)
    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsGenerating(false)
      const msg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка: ${msg}`)
    }
  }

  const scriptOverLimit = script.length > HEYGEN_LIMITS.maxScriptLength

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT PANEL — Controls */}
      <div className="space-y-4">
        {/* Source Type Toggle */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Режим генерации</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSourceType('image')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                sourceType === 'image'
                  ? 'bg-purple-600 text-white'
                  : 'glass-panel text-zinc-400 hover:text-white'
              }`}
              data-testid="heygen-source-image"
            >
              Image-to-Video
            </button>
            <button
              onClick={() => setSourceType('avatar')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                sourceType === 'avatar'
                  ? 'bg-purple-600 text-white'
                  : 'glass-panel text-zinc-400 hover:text-white'
              }`}
              data-testid="heygen-source-avatar"
            >
              Photo Avatar
            </button>
          </div>
        </div>

        {/* Avatar ID Input (Photo Avatar mode) */}
        {sourceType === 'avatar' && (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">ID аватара</h3>
            <input
              type="text"
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              placeholder="Введите ID аватара из HeyGen (например, avatar_xxxxx)"
              className="w-full glass-input px-3 py-2 rounded-lg text-sm bg-zinc-900 text-white placeholder:text-zinc-500"
              data-testid="heygen-avatar-id"
            />
            <p className="text-xs text-zinc-500">
              Найдите ID аватара в{' '}
              <a
                href="https://app.heygen.com/avatars"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                HeyGen Dashboard
              </a>
            </p>
          </div>
        )}

        {/* Image Upload (Image-to-Video mode only) */}
        {sourceType === 'image' && (
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Изображение аватара</h3>
          <div
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="heygen-image-upload"
          >
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-lg object-contain"
                  data-testid="heygen-image-preview"
                />
                <p className="text-xs text-zinc-500 mt-2">{imageFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-zinc-500" />
                <p className="text-sm text-zinc-400">Нажмите для загрузки</p>
                <p className="text-xs text-zinc-600">JPG, PNG · до {HEYGEN_LIMITS.maxImageSizeMB}МБ</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        )}

        {/* Audio Source */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Аудио</h3>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setAudioMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                audioMode === 'text' ? 'bg-purple-600 text-white' : 'glass-panel text-zinc-400 hover:text-white'
              }`}
              data-testid="heygen-audio-text-mode"
            >
              <Mic className="w-4 h-4" />
              Текст в речь
            </button>
            <button
              onClick={() => setAudioMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                audioMode === 'file' ? 'bg-purple-600 text-white' : 'glass-panel text-zinc-400 hover:text-white'
              }`}
              data-testid="heygen-audio-file-mode"
            >
              <FileAudio className="w-4 h-4" />
              Аудиофайл
            </button>
          </div>

          {/* Text mode */}
          {audioMode === 'text' && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Введите текст для озвучки..."
                  rows={4}
                  className={`glass-input w-full px-3 py-2 rounded-lg text-sm resize-none ${
                    scriptOverLimit ? 'border-red-500/50' : ''
                  }`}
                  data-testid="heygen-script"
                />
                <span className={`absolute bottom-2 right-2 text-xs ${
                  scriptOverLimit ? 'text-red-400' : 'text-zinc-500'
                }`}>
                  {script.length}/{HEYGEN_LIMITS.maxScriptLength}
                </span>
              </div>

              {/* Voice Selector */}
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                selectedVoiceName={selectedVoiceName}
                onVoiceSelect={(id, name) => {
                  setSelectedVoiceId(id)
                  setSelectedVoiceName(name)
                }}
              />

              {/* Voice Tuning */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400">Настройка голоса</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-16">Скорость</span>
                    <input
                      type="range"
                      min={HEYGEN_VOICE_SPEED.min}
                      max={HEYGEN_VOICE_SPEED.max}
                      step={HEYGEN_VOICE_SPEED.step}
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                      className="flex-1 accent-purple-500"
                      data-testid="heygen-voice-speed"
                    />
                    <span className="text-xs text-zinc-400 w-8 text-right">{voiceSpeed}x</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-16">Тон</span>
                    <input
                      type="range"
                      min={HEYGEN_VOICE_PITCH.min}
                      max={HEYGEN_VOICE_PITCH.max}
                      step={HEYGEN_VOICE_PITCH.step}
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(Number(e.target.value))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-xs text-zinc-400 w-8 text-right">{voicePitch > 0 ? '+' : ''}{voicePitch}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File mode */}
          {audioMode === 'file' && (
            <div>
              <div
                className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => audioInputRef.current?.click()}
              >
                {audioFile ? (
                  <p className="text-sm text-zinc-300">{audioFile.name}</p>
                ) : (
                  <div className="space-y-1">
                    <FileAudio className="w-6 h-6 mx-auto text-zinc-500" />
                    <p className="text-sm text-zinc-400">Загрузить аудио</p>
                    <p className="text-xs text-zinc-600">MP3, WAV · до {HEYGEN_LIMITS.maxAudioSizeMB}МБ</p>
                  </div>
                )}
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/wav"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </div>
          )}
        </div>

        {/* Video Settings */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Настройки видео</h3>

          {/* Resolution */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Разрешение</label>
            <div className="grid grid-cols-3 gap-2" data-testid="heygen-resolution">
              {HEYGEN_RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResolution(r.value)}
                  className={`glass-panel py-2 rounded-lg text-sm transition-all ${
                    resolution === r.value
                      ? 'ring-2 ring-purple-500 bg-purple-500/10 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Соотношение сторон</label>
            <div className="grid grid-cols-2 gap-2" data-testid="heygen-aspect-ratio">
              {HEYGEN_ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  onClick={() => setAspectRatio(ar.value)}
                  className={`glass-panel py-2 rounded-lg text-sm transition-all ${
                    aspectRatio === ar.value
                      ? 'ring-2 ring-purple-500 bg-purple-500/10 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Background (Image-to-Video mode only) */}
        {sourceType === 'image' && (
        <div className="glass-panel rounded-xl p-4 space-y-3" data-testid="heygen-background">
          <h3 className="text-sm font-medium text-zinc-300">Фон</h3>
          <BackgroundSelector
            removeBackground={removeBackground}
            onRemoveBackgroundChange={setRemoveBackground}
            backgroundConfig={backgroundConfig}
            onBackgroundConfigChange={setBackgroundConfig}
          />
        </div>
        )}

        {/* Motion & Expressiveness (Photo Avatar mode only) */}
        {sourceType === 'avatar' && (
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Движение и экспрессия</h3>

          {/* Expressiveness Level */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Экспрессия</label>
            <div className="grid grid-cols-3 gap-2">
              {HEYGEN_EXPRESSIVENESS_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setExpressiveness(level.value)}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    expressiveness === level.value
                      ? 'ring-2 ring-purple-500 bg-purple-500/10 text-white'
                      : 'glass-panel text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Motion Prompt */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Движение</label>
            <select
              value={motionPrompt}
              onChange={(e) => {
                setMotionPrompt(e.target.value)
                setCustomMotionPrompt('')
              }}
              className="w-full glass-input px-3 py-2 rounded-lg text-sm bg-zinc-900 text-white"
            >
              {HEYGEN_MOTION_PROMPTS.map((prompt) => (
                <option key={prompt.value} value={prompt.value} className="bg-zinc-900 text-white">
                  {prompt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={customMotionPrompt}
              onChange={(e) => {
                setCustomMotionPrompt(e.target.value)
                if (e.target.value) setMotionPrompt('')
              }}
              placeholder="Или введите свое движение..."
              className="w-full glass-input px-3 py-2 rounded-lg text-sm bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            <p className="text-[10px] text-zinc-500">
              Пример: "nodding gently", "gesturing with hands", "slight head tilt"
            </p>
          </div>
        </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || scriptOverLimit}
          className="w-full py-3 rounded-xl font-medium transition-all bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
          data-testid="heygen-generate-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {stepText} ({timer}с)
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Сгенерировать · от ${getEstimatedCost().toFixed(3)}/с
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL — Result */}
      <div className="space-y-4">
        {videoResult ? (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300">Результат</h3>
              {actualCost && (
                <span className="text-xs text-zinc-500">~${actualCost.toFixed(3)}/с</span>
              )}
            </div>
            <video
              src={videoResult}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
            <a
              href={videoResult}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg glass-panel text-sm text-zinc-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Скачать видео
            </a>

          </div>
        ) : (
          <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-64 space-y-3">
            {isGenerating ? (
              <>
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-zinc-300 font-medium">{stepText}</p>
                <p className="text-zinc-500 text-sm">{timer}с</p>
              </>
            ) : (
              <>
                <Video className="w-10 h-10 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Загрузите изображение и нажмите «Сгенерировать»</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
