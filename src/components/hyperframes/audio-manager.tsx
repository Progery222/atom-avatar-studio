"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Volume2,
  Play,
  Pause,
  Trash2,
  Mic,
  Loader2,
  Plus,
  Music,
} from "lucide-react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import { uploadFileToSupabase } from "@/lib/supabase";
import type { Clip, Track, DataAttributes } from "@/types/hyperframes";

const ACCEPTED_AUDIO = ".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg";

const TTS_VOICES = [
  { id: "alloy", name: "Alloy", provider: "openai" as const },
  { id: "echo", name: "Echo", provider: "openai" as const },
  { id: "fable", name: "Fable", provider: "openai" as const },
  { id: "onyx", name: "Onyx", provider: "openai" as const },
  { id: "nova", name: "Nova", provider: "openai" as const },
  { id: "shimmer", name: "Shimmer", provider: "openai" as const },
  { id: "gemini-flash", name: "Gemini Flash", provider: "gemini-flash" as const },
];

function generateId(): string {
  return `clip-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateTrackId(): string {
  return `track-audio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export default function AudioManager() {
  const { composition, updateComposition } = useHyperFramesStore();

  const [uploading, setUploading] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState(TTS_VOICES[0].id);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioTracks = composition.tracks.filter((t) => t.type === "audio");

  const ensureAudioTrack = useCallback((): Track => {
    const existing = composition.tracks.find((t) => t.type === "audio");
    if (existing) return existing;

    const newTrack: Track = {
      id: generateTrackId(),
      name: "Audio 1",
      type: "audio",
      clips: [],
      locked: false,
      visible: true,
      volume: 1,
    };

    updateComposition({
      tracks: [...composition.tracks, newTrack],
    });

    return newTrack;
  }, [composition.tracks, updateComposition]);

  const addAudioClip = useCallback(
    (url: string, fileName: string, duration: number) => {
      const track = ensureAudioTrack();
      const clip: Clip = {
        id: generateId(),
        trackId: track.id,
        startTime: 0,
        duration,
        type: "audio",
        content: url,
        dataAttributes: {
          "data-volume": 1,
          "data-start": 0,
          "data-duration": duration,
        },
        transitions: {},
      };

      updateComposition({
        tracks: composition.tracks.map((t) =>
          t.id === track.id
            ? { ...t, clips: [...t.clips, clip] }
            : t
        ),
      });
    },
    [composition.tracks, ensureAudioTrack, updateComposition]
  );

  const updateClipDataAttribute = useCallback(
    (clipId: string, key: keyof DataAttributes, value: string | number) => {
      updateComposition({
        tracks: composition.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  dataAttributes: { ...c.dataAttributes, [key]: value },
                }
              : c
          ),
        })),
      });
    },
    [composition.tracks, updateComposition]
  );

  const stopPreview = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setPreviewingId(null);
  }, []);

  const removeClip = useCallback(
    (clipId: string) => {
      updateComposition({
        tracks: composition.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        })),
      });
      if (previewingId === clipId) {
        stopPreview();
      }
    },
    [composition.tracks, updateComposition, previewingId, stopPreview]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const ext = file.name.split(".").pop() || "mp3";
        const path = `audio/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const url = await uploadFileToSupabase("media", path, file);

        // Estimate duration from file (fallback to 10s)
        const duration = await estimateAudioDuration(file);
        addAudioClip(url, file.name, duration);
      } catch (err) {
        console.error("Audio upload failed:", err);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [addAudioClip]
  );

  const handleTtsGenerate = useCallback(async () => {
    if (!ttsText.trim()) return;

    const voice = TTS_VOICES.find((v) => v.id === ttsVoice);
    if (!voice) return;

    setTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: voice.provider,
          text: ttsText.trim(),
          voiceId: voice.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "TTS failed");

      // Estimate ~150 words per minute for duration
      const wordCount = ttsText.trim().split(/\s+/).length;
      const duration = Math.max(2, Math.ceil((wordCount / 150) * 60));

      addAudioClip(data.audioUrl, `TTS: ${ttsText.slice(0, 30)}...`, duration);
      setTtsText("");
    } catch (err) {
      console.error("TTS generation failed:", err);
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, ttsVoice, addAudioClip]);

  const togglePreview = useCallback(
    (clip: Clip) => {
      if (previewingId === clip.id && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(clip.content);
      audio.volume = (clip.dataAttributes["data-volume"] as number) ?? 1;
      audio.onended = () => {
        setIsPlaying(false);
        setPreviewingId(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setPreviewingId(null);
      };
      audio.play();
      audioRef.current = audio;
      setPreviewingId(clip.id);
      setIsPlaying(true);
    },
    [previewingId, isPlaying]
  );

  const allAudioClips = audioTracks.flatMap((t) =>
    t.clips.filter((c) => c.type === "audio")
  );

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Upload Section */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Upload size={14} />
          Upload Audio
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_AUDIO}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-purple-500/40 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-purple-400" />
          ) : (
            <Music size={24} />
          )}
          <span className="text-xs">
            {uploading ? "Uploading..." : "Click to upload MP3 / WAV / OGG"}
          </span>
        </button>
      </div>

      {/* TTS Section */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Mic size={14} />
          Text-to-Speech
        </h3>

        <div className="flex flex-col gap-2">
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Enter text to synthesize..."
            rows={3}
            className="glass-input w-full rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          />

          <div className="flex gap-2">
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="glass-input flex-1 rounded-md px-3 py-1.5 text-sm text-zinc-200 bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            >
              {TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-zinc-900">
                  {v.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTtsGenerate}
              disabled={ttsLoading || !ttsText.trim()}
              className="flex items-center gap-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              {ttsLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Mic size={14} />
              )}
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Audio Clips List */}
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Volume2 size={14} />
          Audio Clips
          <span className="ml-auto text-zinc-600">
            {allAudioClips.length}
          </span>
        </h3>

        {allAudioClips.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4">
            No audio clips yet. Upload a file or generate TTS.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {allAudioClips.map((clip) => {
              const volume =
                (clip.dataAttributes["data-volume"] as number) ?? 1;
              const isPreviewing =
                previewingId === clip.id && isPlaying;
              const fileName = clip.content
                .split("/")
                .pop()
                ?.split("?")[0] || "audio";

              return (
                <div
                  key={clip.id}
                  className="rounded-md border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-2"
                >
                  {/* Clip header */}
                  <div className="flex items-center gap-2">
                    <div className="h-6 flex-1 rounded bg-cyan-600/30 border border-cyan-500/20 flex items-center px-2 overflow-hidden">
                      <span className="text-[10px] text-cyan-300 truncate">
                        {fileName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePreview(clip)}
                      className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title={isPreviewing ? "Pause" : "Play"}
                    >
                      {isPreviewing ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeClip(clip.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Volume slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 size={12} className="text-zinc-500 shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) =>
                        updateClipDataAttribute(
                          clip.id,
                          "data-volume",
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1 h-1 appearance-none bg-white/10 rounded-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-500 w-8 text-right tabular-nums">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  {/* Duration info */}
                  <div className="text-[10px] text-zinc-600">
                    Duration: {clip.duration.toFixed(1)}s
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Track Button */}
      <button
        type="button"
        onClick={() => {
          const newTrack: Track = {
            id: generateTrackId(),
            name: `Audio ${audioTracks.length + 1}`,
            type: "audio",
            clips: [],
            locked: false,
            visible: true,
            volume: 1,
          };
          updateComposition({
            tracks: [...composition.tracks, newTrack],
          });
        }}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-white/10 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:border-purple-500/40 transition-colors"
      >
        <Plus size={14} />
        Add Audio Track
      </button>
    </div>
  );
}

function estimateAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    audio.onloadedmetadata = () => {
      const dur = isFinite(audio.duration) ? audio.duration : 10;
      URL.revokeObjectURL(url);
      resolve(dur);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(10);
    };

    // Timeout fallback
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(10);
    }, 5000);

    audio.src = url;
  });
}
