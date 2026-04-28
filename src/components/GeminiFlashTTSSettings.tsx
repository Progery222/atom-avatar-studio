"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Info, Languages, Loader2, Play, Sparkles, Star, User, Users, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GEMINI_FLASH_AUDIO_TAGS,
  GEMINI_FLASH_LANGUAGES,
  GEMINI_FLASH_VOICES,
} from "@/constants/gemini-flash-tts";

type GenderFilter = "all" | "female" | "male";

const FAVORITES_STORAGE_KEY = "gemini_flash_favorite_voices";

function loadFavoriteVoiceIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

interface GeminiFlashTTSSettingsProps {
  voiceName: string;
  onVoiceNameChange: (voice: string) => void;
  languageCode: string;
  onLanguageCodeChange: (locale: string) => void;
  showSettings: boolean;
  onToggleSettings: (show: boolean) => void;
}

export default function GeminiFlashTTSSettings({
  voiceName,
  onVoiceNameChange,
  languageCode,
  onLanguageCodeChange,
  showSettings,
  onToggleSettings,
}: GeminiFlashTTSSettingsProps) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>(loadFavoriteVoiceIds);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteVoiceIds));
  }, [favoriteVoiceIds]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Gemini Flash voices are multilingual, so locale is informational for UI.
  const filteredVoices = GEMINI_FLASH_VOICES.filter((voice) => {
    return genderFilter === "all" || voice.gender.toLowerCase() === genderFilter;
  });

  const favoriteVoices = filteredVoices.filter((voice) => favoriteVoiceIds.includes(voice.id));
  const availableVoices = favoritesOnly ? favoriteVoices : filteredVoices;
  const currentVoice =
    availableVoices.find((voice) => voice.id === voiceName) ||
    GEMINI_FLASH_VOICES.find((voice) => voice.id === voiceName);

  const isFavorite = (voiceId: string) => favoriteVoiceIds.includes(voiceId);

  const toggleFavorite = (voiceId: string) => {
    setFavoriteVoiceIds((prev) => {
      if (prev.includes(voiceId)) {
        return prev.filter((id) => id !== voiceId);
      }
      return [...prev, voiceId];
    });
  };

  const handleGenderFilterChange = (gender: GenderFilter) => {
    setGenderFilter(gender);
    const firstVoice = GEMINI_FLASH_VOICES.find(
      (voice) => gender === "all" || voice.gender.toLowerCase() === gender
    );
    if (firstVoice) {
      onVoiceNameChange(firstVoice.id);
    }
  };

  const handleFavoritesOnlyChange = (enabled: boolean) => {
    setFavoritesOnly(enabled);
    if (!enabled) return;
    if (favoriteVoices.length === 0) return;
    if (!favoriteVoices.some((voice) => voice.id === voiceName)) {
      onVoiceNameChange(favoriteVoices[0].id);
    }
  };

  const handlePreviewVoice = async () => {
    if (!currentVoice) return;

    // Cancel any in-flight preview
    if (isPreviewLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsPreviewLoading(false);
      return;
    }

    setPreviewError(null);
    setIsPreviewLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/tts/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: currentVoice.id,
          languageCode,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate preview (${response.status})`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setPreviewError('Failed to play audio');
      };

      await audio.play();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled — no error to show
        return;
      }
      console.error('[Voice Preview] Error:', error);
      setPreviewError(error.message || 'Failed to generate preview');
    } finally {
      setIsPreviewLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="space-y-3 p-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl">
      <button
        onClick={() => onToggleSettings(!showSettings)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">Gemini 3.1 Flash TTS</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">NEW</span>
        </div>
        {showSettings ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {showSettings && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/50 flex items-center gap-1">
              <Languages className="w-3 h-3" />
              Language
            </label>
            <select
              value={languageCode}
              onChange={(e) => onLanguageCodeChange(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
            >
              {GEMINI_FLASH_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/35">
              Gemini Flash auto-detects language. This selector is for your target locale.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-white/50 flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Voice ({availableVoices.length} available)
            </label>

            <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg">
              <button
                onClick={() => handleGenderFilterChange("all")}
                className={cn(
                  "flex-1 py-1.5 px-2 text-[10px] rounded-md flex items-center justify-center gap-1 transition-all",
                  genderFilter === "all"
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                )}
              >
                All
              </button>
              <button
                onClick={() => handleGenderFilterChange("female")}
                className={cn(
                  "flex-1 py-1.5 px-2 text-[10px] rounded-md flex items-center justify-center gap-1 transition-all",
                  genderFilter === "female"
                    ? "bg-pink-500/30 text-pink-300 border border-pink-500/30"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <User className="w-3 h-3" />
                Female
              </button>
              <button
                onClick={() => handleGenderFilterChange("male")}
                className={cn(
                  "flex-1 py-1.5 px-2 text-[10px] rounded-md flex items-center justify-center gap-1 transition-all",
                  genderFilter === "male"
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <Users className="w-3 h-3" />
                Male
              </button>
            </div>

            <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg">
              <button
                onClick={() => handleFavoritesOnlyChange(false)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-[10px] rounded-md transition-all",
                  !favoritesOnly
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                )}
              >
                All Voices
              </button>
              <button
                onClick={() => handleFavoritesOnlyChange(true)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-[10px] rounded-md transition-all flex items-center justify-center gap-1",
                  favoritesOnly
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <Star className="w-3 h-3" />
                Favorites
              </button>
            </div>

            {favoriteVoices.length > 0 && (
              <div className="p-2 bg-zinc-800/40 border border-white/10 rounded-lg">
                <div className="text-[10px] text-white/45 mb-1.5">Quick favorites:</div>
                <div className="flex flex-wrap gap-1">
                  {favoriteVoices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => onVoiceNameChange(voice.id)}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] border transition-all",
                        voiceName === voice.id
                          ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      {voice.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <select
              value={currentVoice ? voiceName : availableVoices[0]?.id || ""}
              onChange={(e) => onVoiceNameChange(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
            >
              {availableVoices.length === 0 ? (
                <option value="">No voices for selected filters</option>
              ) : (
                availableVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description} ({voice.gender === "Female" ? "F" : "M"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-1.5 text-[10px] text-blue-300">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Supported expressive tags:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {GEMINI_FLASH_AUDIO_TAGS.slice(0, 8).map((tag) => (
                    <span
                      key={tag.tag}
                      className="px-1 py-0.5 bg-blue-500/20 rounded text-[9px] font-mono"
                    >
                      {tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {currentVoice && (
            <div className="text-[10px] text-white/30 px-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span>
                  Selected: <span className="text-white/60">{currentVoice.name}</span> (
                  {currentVoice.gender}) - {currentVoice.description}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice();
                  }}
                  disabled={false}
                  className={cn(
                    "p-1 rounded border flex items-center justify-center transition-all",
                    isPreviewLoading
                      ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
                      : previewError
                        ? "border-red-400/40 bg-red-500/10 text-red-300"
                        : "border-white/15 text-white/60 hover:bg-white/10 hover:text-white/80"
                  )}
                  title={previewError || "Listen to voice preview"}
                >
                  {isPreviewLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>
              </span>
              <button
                onClick={() => toggleFavorite(currentVoice.id)}
                className={cn(
                  "px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition-all",
                  isFavorite(currentVoice.id)
                    ? "text-amber-300 border-amber-400/40 bg-amber-500/10"
                    : "text-white/60 border-white/15 hover:bg-white/5"
                )}
              >
                <Star className={cn("w-3 h-3", isFavorite(currentVoice.id) ? "fill-current" : "")} />
                {isFavorite(currentVoice.id) ? "Favorited" : "Add Favorite"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
