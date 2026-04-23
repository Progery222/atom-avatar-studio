"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, Wand2, Globe, Gauge, Sliders, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_VOICES, GEMINI_SCENE_STYLES, GEMINI_LOCALES, GEMINI_AUDIO_TAGS } from "@/constants/gemini-tts";

interface GeminiTTSSettingsProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  sceneStyle: string;
  onSceneStyleChange: (style: string) => void;
  speakingRate: number;
  onSpeakingRateChange: (rate: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
  showSettings: boolean;
  onToggleSettings: (show: boolean) => void;
}

export default function GeminiTTSSettings({
  voice,
  onVoiceChange,
  sceneStyle,
  onSceneStyleChange,
  speakingRate,
  onSpeakingRateChange,
  pitch,
  onPitchChange,
  locale,
  onLocaleChange,
  showSettings,
  onToggleSettings,
}: GeminiTTSSettingsProps) {
  // Get unique locales from available voices
  const availableLocales = [...new Set(GEMINI_VOICES.map((v) => v.locale))];

  // Filter voices by selected locale
  const filteredVoices = GEMINI_VOICES.filter((v) => v.locale === locale);

  // When locale changes, auto-select first available voice in that language
  const handleLocaleChange = (newLocale: string) => {
    onLocaleChange(newLocale);
    const firstVoiceInLocale = GEMINI_VOICES.find((v) => v.locale === newLocale);
    if (firstVoiceInLocale && firstVoiceInLocale.id !== voice) {
      onVoiceChange(firstVoiceInLocale.id);
    }
  };

  return (
    <>
      {/* Gemini Advanced Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden bg-gradient-to-br from-blue-950/30 to-purple-950/30 border border-blue-500/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">Google Cloud TTS</span>
              </div>
              <button
                onClick={() => onToggleSettings(false)}
                className="text-xs text-white/40 hover:text-white"
              >
                Скрыть
              </button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" /> Голос
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {filteredVoices.length === 0 ? (
                  <p className="col-span-2 text-xs text-white/40 text-center py-2">
                    Нет голосов для этого языка
                  </p>
                ) : (
                  filteredVoices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onVoiceChange(v.id)}
                      className={cn(
                        "p-2 rounded-lg border text-left transition-all",
                        voice === v.id
                          ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", v.gender === "Female" ? "bg-pink-400" : "bg-blue-400")} />
                        <span className="text-[11px] font-medium">{v.name}</span>
                        <span className={cn(
                          "text-[8px] px-1 rounded ml-auto",
                          v.type === 'Studio' ? 'bg-purple-500/30 text-purple-300' :
                          v.type === 'Chirp3-HD' ? 'bg-green-500/30 text-green-300' :
                          v.type === 'WaveNet' ? 'bg-orange-500/30 text-orange-300' :
                          'bg-gray-500/30 text-gray-300'
                        )}>
                          {v.type}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/40 mt-0.5 truncate">{v.description}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Scene Style */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Wand2 className="w-3 h-3" /> Стиль сцены
              </label>
              <select
                value={sceneStyle}
                onChange={(e) => onSceneStyleChange(e.target.value)}
                className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white"
              >
                {GEMINI_SCENE_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-zinc-900 text-white">
                    {style.name} — {style.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Язык
              </label>
              <select
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value)}
                className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white"
              >
                {GEMINI_LOCALES.filter((l) => availableLocales.includes(l.code)).map((l) => (
                  <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaking Rate & Pitch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[11px] text-white/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3 h-3" /> Скорость
                  </span>
                  <span className="text-blue-300">{speakingRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={speakingRate}
                  onChange={(e) => onSpeakingRateChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] text-white/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3" /> Тон
                  </span>
                  <span
                    className={cn(
                      "text-blue-300",
                      pitch > 0 ? "text-blue-300" : pitch < 0 ? "text-purple-300" : "text-white/60"
                    )}
                  >
                    {pitch > 0 ? `+${pitch}` : pitch}
                  </span>
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="5"
                  value={pitch}
                  onChange={(e) => onPitchChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>

            {/* Audio Tags Help */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Music className="w-3 h-3" /> Доступные теги в тексте
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GEMINI_AUDIO_TAGS.slice(0, 8).map((tag) => (
                  <span
                    key={tag.tag}
                    className="text-[9px] px-2 py-1 bg-white/10 rounded border border-white/10 text-white/60"
                  >
                    {tag.tag}
                  </span>
                ))}
                <span className="text-[9px] px-2 py-1 text-white/40">+{GEMINI_AUDIO_TAGS.length - 8} ещё</span>
              </div>
              <p className="text-[9px] text-white/40">Пример: &quot;Привет [laughs], как дела?&quot;</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini Mini Preview when settings collapsed */}
      {!showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-blue-200">
              {GEMINI_VOICES.find((v) => v.id === voice)?.name} •{" "}
              {GEMINI_SCENE_STYLES.find((s) => s.id === sceneStyle)?.name}
            </span>
          </div>
          <button onClick={() => onToggleSettings(true)} className="text-[10px] text-blue-300 hover:text-blue-200">
            Настроить
          </button>
        </motion.div>
      )}
    </>
  );
}
