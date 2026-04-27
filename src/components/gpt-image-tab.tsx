'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Loader2, Download, ImageIcon, X, AlertCircle, Coins, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFileToSupabase } from '@/lib/supabase'
import { historyService } from '@/lib/history-service'
import {
  GPT_IMAGE_ASPECT_RATIOS,
  GPT_IMAGE_RESOLUTIONS,
  GPT_IMAGE_PRICING,
  GPT_IMAGE_DEFAULTS,
  GPT_IMAGE_LIMITS,
  GPT_IMAGE_MODELS,
} from '@/constants/gpt-image'
import type { GptImageGenerationMode } from '@/types/gpt-image'

const IMAGE_MODELS = [
  { id: 'gpt-image-2', name: 'GPT Image 2' },
]

export default function GptImageTab() {
  const [selectedImageModel, setSelectedImageModel] = useState('gpt-image-2')
  const [mode, setMode] = useState<GptImageGenerationMode>('text-to-image')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<string>(GPT_IMAGE_DEFAULTS.aspectRatio)
  const [resolution, setResolution] = useState<string>(GPT_IMAGE_DEFAULTS.resolution)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [taskState, setTaskState] = useState<string>('')
  const [timer, setTimer] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits()
  }, [])

  // Constraint validation: auto aspect ratio only supports 1K
  useEffect(() => {
    if (aspectRatio === 'auto' && resolution !== '1K') {
      setResolution('1K')
    }
  }, [aspectRatio, resolution])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/gpt-image/credits')
      const result = await res.json()
      if (result.success && typeof result.data === 'number') {
        setCredits(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch credits', err)
    }
  }

  const getEstimatedCost = useCallback(() => {
    return GPT_IMAGE_PRICING[resolution] ?? 0
  }, [resolution])

  const isConstraintValid = () => {
    // 1:1 cannot be 4K
    if (aspectRatio === '1:1' && resolution === '4K') return false
    // auto only supports 1K
    if (aspectRatio === 'auto' && resolution !== '1K') return false
    return true
  }

  const isGenerateDisabled = () => {
    if (isGenerating) return true
    if (!prompt.trim()) return true
    if (!isConstraintValid()) return true
    const cost = getEstimatedCost()
    if (credits !== null && cost > credits) return true
    if (mode === 'image-to-image' && uploadedImages.length === 0) return true
    return false
  }

  const getGenerateButtonTooltip = (): string | null => {
    if (isGenerating) return 'Генерация уже запущена'
    if (!prompt.trim()) return 'Введите описание изображения'
    if (!isConstraintValid()) return 'Выбраны несовместимые параметры'
    const cost = getEstimatedCost()
    if (credits !== null && cost > credits) return 'Недостаточно кредитов'
    if (mode === 'image-to-image' && uploadedImages.length === 0) return 'Загрузите хотя бы одно изображение'
    return null
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
    const totalCount = uploadedImages.length + newFiles.length
    if (totalCount > GPT_IMAGE_LIMITS.maxInputUrls) {
      alert(`Максимум ${GPT_IMAGE_LIMITS.maxInputUrls} изображений`)
      return
    }

    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`Файл "${file.name}" не является изображением`)
        return false
      }
      return true
    })

    setUploadedImages((prev) => [...prev, ...validFiles])
    // Reset uploaded URLs since we have new files that need uploading
    setUploadedImageUrls([])
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files)
    e.target.value = ''
  }

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current += 1
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current -= 1
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    handleImageUpload(e.dataTransfer.files)
  }

  const uploadImagesToSupabase = async (): Promise<string[]> => {
    if (uploadedImageUrls.length === uploadedImages.length) {
      return uploadedImageUrls
    }
    const urls: string[] = []
    for (let i = 0; i < uploadedImages.length; i++) {
      const file = uploadedImages[i]
      const ext = file.name.split('.').pop() || 'png'
      const filename = `gpt_image_${Date.now()}_${i}.${ext}`
      const url = await uploadFileToSupabase('media', filename, file)
      urls.push(url)
    }
    setUploadedImageUrls(urls)
    return urls
  }

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startPolling = useCallback((id: string) => {
    setTaskState('waiting')
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/gpt-image/status?taskId=${encodeURIComponent(id)}`)
        const result = await res.json()

        if (result.success) {
          const { state, resultUrls, failMsg } = result
          setTaskState(state)

          if (state === 'success' && resultUrls && resultUrls.length > 0) {
            clearPolling()
            const url = resultUrls[0]
            setResultImageUrl(url)
            setIsGenerating(false)
            fetchCredits()

            historyService.addItem({
              id,
              timestamp: Date.now(),
              modelId: GPT_IMAGE_MODELS[mode],
              modelName: 'GPT Image 2',
              provider: 'gpt-image',
              status: 'success',
              cost: getEstimatedCost(),
              resultImageUrl: url,
              generationType: 'image',
              aspectRatio,
              resolution,
              params: {
                emotion: '',
                camera: '',
                resolution,
                aspectRatio,
                duration: 0,
              },
            })
          } else if (state === 'fail') {
            clearPolling()
            setIsGenerating(false)
            setError(failMsg || 'Ошибка генерации изображения')

            historyService.addItem({
              id,
              timestamp: Date.now(),
              modelId: GPT_IMAGE_MODELS[mode],
              modelName: 'GPT Image 2',
              provider: 'gpt-image',
              status: 'fail',
              cost: null,
              generationType: 'image',
              aspectRatio,
              resolution,
              params: {
                emotion: '',
                camera: '',
                resolution,
                aspectRatio,
                duration: 0,
              },
            })
          }
        }
      } catch (err) {
        console.error('Polling error', err)
      }
    }, 5000)
  }, [aspectRatio, clearPolling, getEstimatedCost, mode, resolution])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Пожалуйста, введите описание изображения.')
      return
    }
    if (mode === 'image-to-image' && uploadedImages.length === 0) {
      alert('Пожалуйста, загрузите хотя бы одно изображение.')
      return
    }
    if (!isConstraintValid()) {
      alert('Выбраны несовместимые параметры.')
      return
    }

    setIsGenerating(true)
    setResultImageUrl(null)
    setError(null)
    setTaskState('')
    setTimer(0)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimer(Math.round((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    try {
      let inputUrls: string[] | undefined
      if (mode === 'image-to-image') {
        inputUrls = await uploadImagesToSupabase()
      }

      const res = await fetch('/api/gpt-image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          prompt,
          aspectRatio,
          resolution,
          inputUrls,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Ошибка создания задачи')
      }

      const newTaskId = data.taskId
      startPolling(newTaskId)
    } catch (err) {
      clearPolling()
      setIsGenerating(false)
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(msg)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleGenerate()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])

  const promptOverLimit = prompt.length > GPT_IMAGE_LIMITS.maxPromptLength
  const estimatedCost = getEstimatedCost()
  const insufficientCredits = credits !== null && estimatedCost > credits

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT PANEL — Settings */}
      <div className="space-y-4">
        {/* Model Selector */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Модель</h3>
          <div className="grid grid-cols-1 gap-2 relative">
            {IMAGE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedImageModel(model.id)}
                className={cn(
                  'relative py-2.5 rounded-lg text-sm font-medium transition-all',
                  selectedImageModel === model.id
                    ? 'text-white'
                    : 'glass-panel text-zinc-400 hover:text-white'
                )}
              >
                {selectedImageModel === model.id && (
                  <motion.div
                    layoutId="activeImageModel"
                    className="absolute inset-0 bg-purple-600 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{model.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Режим генерации</h3>
          <div className="grid grid-cols-2 gap-2 relative">
            <button
              onClick={() => setMode('text-to-image')}
              className={cn(
                'relative py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'text-to-image'
                  ? 'text-white'
                  : 'glass-panel text-zinc-400 hover:text-white'
              )}
            >
              {mode === 'text-to-image' && (
                <motion.div
                  layoutId="activeModel"
                  className="absolute inset-0 bg-purple-600 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Text-to-Image</span>
            </button>
            <button
              onClick={() => setMode('image-to-image')}
              className={cn(
                'relative py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'image-to-image'
                  ? 'text-white'
                  : 'glass-panel text-zinc-400 hover:text-white'
              )}
            >
              {mode === 'image-to-image' && (
                <motion.div
                  layoutId="activeModel"
                  className="absolute inset-0 bg-purple-600 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Image-to-Image</span>
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Описание</h3>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите изображение, которое хотите создать..."
              rows={5}
              className={cn(
                'glass-input w-full px-3 py-2 rounded-lg text-sm resize-none',
                promptOverLimit && 'border-red-500/50'
              )}
            />
            <span
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                promptOverLimit ? 'text-red-400' : 'text-zinc-500'
              )}
            >
              {prompt.length}/{GPT_IMAGE_LIMITS.maxPromptLength}
            </span>
          </div>
        </div>

        {/* Image Upload (Image-to-Image mode only) */}
        <AnimatePresence>
          {mode === 'image-to-image' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">Референсные изображения</h3>
                <div
                  className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 mx-auto text-zinc-500" />
                  <p className="text-sm text-zinc-400 mt-2">Нажмите или перетащите изображения</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    До {GPT_IMAGE_LIMITS.maxInputUrls} изображений
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* Image previews */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aspect Ratio */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Соотношение сторон</h3>
          <div className="grid grid-cols-3 gap-2">
            {GPT_IMAGE_ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={cn(
                  'py-2 rounded-lg text-sm transition-all',
                  aspectRatio === ar.value
                    ? 'ring-2 ring-purple-500 bg-purple-500/10 text-white'
                    : 'glass-panel text-zinc-400 hover:text-white'
                )}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Разрешение</h3>
          <div className="grid grid-cols-3 gap-2">
            {GPT_IMAGE_RESOLUTIONS.map((res) => {
              const disabled = aspectRatio === '1:1' && res.value === '4K'
              return (
                <button
                  key={res.value}
                  onClick={() => !disabled && setResolution(res.value)}
                  disabled={disabled}
                  className={cn(
                    'py-2 rounded-lg text-sm transition-all',
                    disabled && 'opacity-50 cursor-not-allowed',
                    resolution === res.value
                      ? 'ring-2 ring-purple-500 bg-purple-500/10 text-white'
                      : 'glass-panel text-zinc-400 hover:text-white'
                  )}
                >
                  <div>{res.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{res.pixelSize}</div>
                </button>
              )
            })}
          </div>

          {/* Constraint warnings */}
          {aspectRatio === 'auto' && resolution === '1K' && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Автоматическое соотношение поддерживает только разрешение 1K
            </p>
          )}
        </div>

        {/* Credits & Cost */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Примерная стоимость</span>
            <span className="text-sm font-medium text-white flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {estimatedCost} кредитов
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Баланс</span>
            <span className="text-sm font-medium text-white flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {credits !== null ? `${credits} кредитов` : '—'}
            </span>
          </div>
          {insufficientCredits && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Недостаточно кредитов
            </p>
          )}
        </div>

        {/* Generate Button */}
        <div className="relative group">
          <button
            onClick={handleGenerate}
            disabled={isGenerateDisabled()}
            className="w-full py-3 rounded-xl font-medium transition-all bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Сгенерировать
              </>
            )}
          </button>
          {isGenerateDisabled() && getGenerateButtonTooltip() && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-xs glass-panel rounded-lg px-3 py-2 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {getGenerateButtonTooltip()}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Result */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-64 space-y-4"
            >
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Повторить
              </button>
            </motion.div>
          ) : resultImageUrl ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Результат</h3>
                <span className="text-xs text-zinc-500">
                  {aspectRatio} · {resolution}
                </span>
              </div>

              {/* Reference images for Image-to-Image */}
              {mode === 'image-to-image' && uploadedImageUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">Референсы</p>
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-16 object-cover rounded-lg opacity-70"
                      />
                    ))}
                  </div>
                </div>
              )}

              <img
                src={resultImageUrl}
                alt="Generated"
                className="w-full rounded-lg"
              />

              <a
                href={resultImageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg glass-panel text-sm text-zinc-300 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать изображение
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-64 space-y-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                  <p className="text-zinc-300 font-medium">Генерация изображения...</p>
                  {taskState && (
                    <p className="text-zinc-500 text-sm capitalize">
                      {taskState === 'waiting' && 'Ожидание'}
                      {taskState === 'queuing' && 'В очереди'}
                      {taskState === 'generating' && 'Генерация'}
                    </p>
                  )}
                  <p className="text-zinc-500 text-sm">{timer}с</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-zinc-600" />
                  <p className="text-zinc-500 text-sm">
                    Введите описание и нажмите «Сгенерировать»
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
