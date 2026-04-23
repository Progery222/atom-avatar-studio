"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Film, Globe, History, Import, Play, X } from "lucide-react";
import { historyService } from "@/lib/history-service";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import type { Clip, DataAttributes, Track } from "@/types/hyperframes";

type ImportTab = "history" | "url";

function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function findFirstVideoTrack(tracks: Track[]): Track | null {
  return tracks.find((t) => t.type === "video") ?? null;
}

function getClipEndTime(track: Track): number {
  if (track.clips.length === 0) return 0;
  return Math.max(...track.clips.map((c) => c.startTime + c.duration));
}

function addVideoClipToComposition(
  videoUrl: string,
  duration: number,
): void {
  const store = useHyperFramesStore.getState();
  const composition = store.composition;
  const videoTrack = findFirstVideoTrack(composition.tracks);

  if (!videoTrack) return;

  const trackIndex = composition.tracks.indexOf(videoTrack);
  const startTime =
    store.selectedClipId && videoTrack.clips.length > 0
      ? getClipEndTime(videoTrack)
      : store.playerState.currentTime;

  const clip: Clip = {
    id: generateClipId(),
    trackId: videoTrack.id,
    startTime,
    duration,
    type: "video",
    content: videoUrl,
    dataAttributes: {
      "data-start": startTime,
      "data-duration": duration,
      "data-track-index": trackIndex,
      "data-volume": 1,
    } as DataAttributes,
    transitions: {},
  };

  const updatedTracks = composition.tracks.map((track) => {
    if (track.id === videoTrack.id) {
      return { ...track, clips: [...track.clips, clip] };
    }
    return track;
  });

  const newDuration = Math.max(
    composition.duration,
    startTime + duration,
  );

  store.updateComposition({
    tracks: updatedTracks,
    duration: newDuration,
  });

  store.setSelectedClipId(clip.id);
  store.setPlayerState({ duration: newDuration });
}

export function importAvatarToHyperFrames(videoUrl: string): void {
  const store = useHyperFramesStore.getState();
  store.setActivePanel("history");

  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = videoUrl;

  video.onloadedmetadata = () => {
    const duration = isFinite(video.duration) ? video.duration : 5;
    addVideoClipToComposition(videoUrl, duration);
    URL.revokeObjectURL(video.src);
  };

  video.onerror = () => {
    addVideoClipToComposition(videoUrl, 5);
    URL.revokeObjectURL(video.src);
  };
}

export default function AvatarImport() {
  const [activeTab, setActiveTab] = useState<ImportTab>("history");
  const [historyItems, setHistoryItems] = useState<
    Awaited<ReturnType<typeof historyService.getHistory>>
  >([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [urlInput, setUrlInput] = useState("");
  const [urlPreviewDuration, setUrlPreviewDuration] = useState<number | null>(
    null,
  );
  const [urlPreviewError, setUrlPreviewError] = useState(false);
  const [importing, setImporting] = useState(false);

  const urlVideoRef = useRef<HTMLVideoElement>(null);
  const durationProbeRef = useRef<HTMLVideoElement | null>(null);

  const composition = useHyperFramesStore((s) => s.composition);

  useEffect(() => {
    const items = historyService.getHistory();
    setHistoryItems(
      items.filter(
        (item) => item.status === "success" && item.resultVideoUrl,
      ),
    );
  }, []);

  const handleUrlPreview = useCallback(() => {
    setUrlPreviewDuration(null);
    setUrlPreviewError(false);
  }, []);

  const handleUrlLoadedMetadata = useCallback(() => {
    if (urlVideoRef.current) {
      const dur = urlVideoRef.current.duration;
      setUrlPreviewDuration(isFinite(dur) ? dur : null);
    }
  }, []);

  const handleUrlError = useCallback(() => {
    setUrlPreviewError(true);
    setUrlPreviewDuration(null);
  }, []);

  const probeVideoDuration = useCallback(
    (url: string): Promise<number> =>
      new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;
        durationProbeRef.current = video;

        video.onloadedmetadata = () => {
          const dur = isFinite(video.duration) ? video.duration : 5;
          resolve(dur);
        };

        video.onerror = () => resolve(5);

        const timeout = setTimeout(() => resolve(5), 8000);
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          const dur = isFinite(video.duration) ? video.duration : 5;
          resolve(dur);
        };
      }),
    [],
  );

  const handleImport = useCallback(
    async (videoUrl: string) => {
      setImporting(true);
      try {
        const duration = await probeVideoDuration(videoUrl);
        addVideoClipToComposition(videoUrl, duration);
      } finally {
        setImporting(false);
      }
    },
    [probeVideoDuration],
  );

  const handleHistoryImport = useCallback(
    (item: (typeof historyItems)[number]) => {
      if (!item.resultVideoUrl) return;
      setSelectedHistoryId(item.id);
      handleImport(item.resultVideoUrl);
    },
    [handleImport],
  );

  const handleUrlImport = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    handleImport(trimmed);
  }, [urlInput, handleImport]);

  const successfulItems = historyItems;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Tab selector */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-[#8b5cf6] text-white"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <History size={14} />
          From History
        </button>
        <button
          onClick={() => setActiveTab("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "url"
              ? "bg-[#8b5cf6] text-white"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Globe size={14} />
          From URL
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "history" ? (
          <div className="flex flex-col gap-2">
            {successfulItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Film size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No generated videos yet</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Create an avatar first, then import it here
                </p>
              </div>
            ) : (
              successfulItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryImport(item)}
                  disabled={importing}
                  className={`glass-panel flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5 ${
                    selectedHistoryId === item.id
                      ? "ring-1 ring-[#8b5cf6]"
                      : ""
                  } ${importing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-10 rounded overflow-hidden bg-zinc-800 shrink-0">
                    {item.inputImageUrl ? (
                      <img
                        src={item.inputImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={16} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {item.modelName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeDate(item.timestamp)}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {item.params.emotion}
                      </span>
                    </div>
                  </div>

                  {/* Import icon */}
                  <Import
                    size={16}
                    className="text-zinc-500 shrink-0"
                  />
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  handleUrlPreview();
                }}
                placeholder="https://example.com/video.mp4"
                className="glass-input flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none"
              />
              <button
                onClick={handleUrlImport}
                disabled={!urlInput.trim() || importing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-medium transition-colors hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Import size={14} />
                {importing ? "..." : "Import"}
              </button>
            </div>

            {/* Video preview */}
            {urlInput.trim() && (
              <div className="glass-panel rounded-lg overflow-hidden">
                {urlPreviewError ? (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
                    <X size={24} className="mb-1" />
                    <p className="text-sm">Unable to load video</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Check the URL and try again
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={urlVideoRef}
                      src={urlInput.trim()}
                      controls
                      className="w-full max-h-48 bg-black"
                      onLoadedMetadata={handleUrlLoadedMetadata}
                      onError={handleUrlError}
                    >
                      <track kind="captions" />
                    </video>
                    {urlPreviewDuration !== null && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                        {urlPreviewDuration.toFixed(1)}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-zinc-600">
              Paste a direct link to an MP4 or WebM video file. The video will
              be added to the first video track at the current playhead
              position.
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-xs text-zinc-600 border-t border-white/5 pt-2">
        {composition.tracks.find((t) => t.type === "video")?.clips.length ??
          0}{" "}
        clip(s) on video track
      </div>
    </div>
  );
}
