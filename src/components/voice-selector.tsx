'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mic } from 'lucide-react'
import type { HeyGenVoice } from '@/types/heygen'
import { HEYGEN_VOICE_LANGUAGES, HEYGEN_VOICE_GENDERS } from '@/constants/heygen'

interface VoiceSelectorProps {
  selectedVoiceId: string | null
  selectedVoiceName?: string
  onVoiceSelect: (voiceId: string, voiceName: string) => void
}

export default function VoiceSelector({ selectedVoiceId, selectedVoiceName, onVoiceSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<HeyGenVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [genderFilter, setGenderFilter] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')

  const fetchVoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (genderFilter) params.set('gender', genderFilter)
      if (languageFilter) params.set('language', languageFilter)
      
      const res = await fetch(`/api/heygen/voices?${params.toString()}`)
      const data = await res.json()
      
      if (data.success) {
        setVoices(data.data)
      } else {
        setError(data.error ?? 'Ошибка загрузки голосов')
      }
    } catch {
      setError('Ошибка загрузки голосов')
    } finally {
      setLoading(false)
    }
  }, [genderFilter, languageFilter])

  useEffect(() => {
    fetchVoices()
  }, [fetchVoices])

  return (
    <div className="space-y-3">
      {/* Selected Voice Indicator */}
      {selectedVoiceId && selectedVoiceName && (
        <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200">Выбран:</span>
            <span className="text-sm font-medium text-white">{selectedVoiceName}</span>
          </div>
          <span className="text-xs text-purple-400/60">ID: {selectedVoiceId.substring(0, 8)}...</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="glass-input flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-900 text-white"
          data-testid="voice-gender-filter"
        >
          <option value="" className="bg-zinc-900 text-white">Все голоса</option>
          {HEYGEN_VOICE_GENDERS.map((g) => (
            <option key={g.value} value={g.value} className="bg-zinc-900 text-white">{g.label}</option>
          ))}
        </select>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="glass-input flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-900 text-white"
          data-testid="voice-language-filter"
        >
          <option value="" className="bg-zinc-900 text-white">Все языки</option>
          {HEYGEN_VOICE_LANGUAGES.map((lang) => (
            <option key={lang} value={lang} className="bg-zinc-900 text-white">{lang}</option>
          ))}
        </select>
      </div>

      {/* Voice List */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-zinc-400 text-sm">
          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
          Загрузка голосов...
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-6 space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchVoices}
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && voices.length === 0 && (
        <p className="text-center text-zinc-400 text-sm py-6">
          Голоса не найдены. Попробуйте другие фильтры
        </p>
      )}

      {!loading && !error && voices.length > 0 && (
        <div
          className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1"
          data-testid="voice-list"
        >
          {voices.map((voice) => (
            <button
              key={voice.voice_id}
              onClick={() => onVoiceSelect(voice.voice_id, voice.name)}
              className={`glass-panel p-2.5 rounded-lg text-left transition-all ${
                selectedVoiceId === voice.voice_id
                  ? 'ring-2 ring-purple-500 bg-purple-500/10'
                  : 'hover:bg-white/5'
              }`}
              data-testid="voice-card"
            >
              <p className="text-sm font-medium text-white truncate">{voice.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-zinc-400 truncate">{voice.language}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  voice.gender === 'female'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {voice.gender === 'female' ? 'Ж' : 'М'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}