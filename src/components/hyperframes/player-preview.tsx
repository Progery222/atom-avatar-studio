"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import { compositionToHtml } from "@/lib/hyperframes/composition-manager";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

export default function PlayerPreview() {
  const composition = useHyperFramesStore((s) => s.composition);
  const playerState = useHyperFramesStore((s) => s.playerState);
  const setPlayerState = useHyperFramesStore((s) => s.setPlayerState);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [srcdoc, setSrcdoc] = useState<string>("");
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const pendingMessagesRef = useRef<Record<string, unknown>[]>([]);

  const lastDimensionsRef = useRef({ w: composition.width, h: composition.height });
  const initializedRef = useRef(false);

  const aspectRatio = composition.width / composition.height || 16 / 9;

  const postToIframe = useCallback((msg: Record<string, unknown>) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && isIframeReady) {
      iframe.contentWindow.postMessage(msg, "*");
    } else {
      pendingMessagesRef.current.push(msg);
    }
  }, [isIframeReady]);

  // Set initial srcdoc once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setSrcdoc(compositionToHtml(composition));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only remount iframe when dimensions change
  useEffect(() => {
    const prev = lastDimensionsRef.current;
    if (prev.w !== composition.width || prev.h !== composition.height) {
      lastDimensionsRef.current = { w: composition.width, h: composition.height };
      const newSrcdoc = compositionToHtml(composition);
      setSrcdoc(newSrcdoc);
      setIsIframeReady(false);
      setIframeKey((k) => k + 1);
    }
  }, [composition.width, composition.height, composition]);

  // Send HTML/CSS updates via postMessage (no iframe remount)
  useEffect(() => {
    if (!isIframeReady) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      postToIframe({
        type: "updateHtml",
        html: composition.html,
        css: composition.css,
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composition.html, composition.css, isIframeReady, postToIframe]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsIframeReady(true);
    // Send any pending messages
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      pendingMessagesRef.current.forEach((msg) => {
        iframe.contentWindow?.postMessage(msg, "*");
      });
      pendingMessagesRef.current = [];
    }
  }, []);

  // Sync play/pause to iframe when it becomes ready or state changes
  useEffect(() => {
    if (!isIframeReady) return;
    postToIframe({
      type: playerState.isPlaying ? "play" : "pause",
      currentTime: playerState.currentTime,
      playbackRate: playerState.playbackRate,
      volume: playerState.volume,
    });
  }, [playerState.isPlaying, playerState.currentTime, playerState.playbackRate, playerState.volume, postToIframe, isIframeReady]);

  // Listen for time updates from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "timeupdate" && typeof e.data.currentTime === "number") {
        setPlayerState({ currentTime: e.data.currentTime });
      }
      if (e.data?.type === "ended") {
        setPlayerState({ isPlaying: false, currentTime: 0 });
      }
      if (e.data?.type === "ready") {
        setIsIframeReady(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setPlayerState]);

  const togglePlay = useCallback(() => {
    setPlayerState({ isPlaying: !playerState.isPlaying });
  }, [playerState.isPlaying, setPlayerState]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerState({ volume: parseFloat(e.target.value) });
    },
    [setPlayerState],
  );

  const handleRateChange = useCallback(
    (rate: number) => {
      setPlayerState({ playbackRate: rate });
      setShowRateMenu(false);
    },
    [setPlayerState],
  );

  const handleFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-2 w-full h-full bg-[#09090b]">
      {/* Preview area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${aspectRatio}`, maxHeight: "100%" }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            srcDoc={srcdoc}
            onLoad={handleIframeLoad}
            className="w-full h-full border-0 rounded-lg bg-[#09090b]"
            sandbox="allow-scripts allow-same-origin"
            title="Composition Preview"
          />
          {!isIframeReady && srcdoc && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]/80 rounded-lg">
              <div className="text-zinc-500 text-sm">Loading preview...</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls toolbar */}
      <div className="glass-panel flex items-center gap-3 px-4 py-2 rounded-lg shrink-0">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!isIframeReady}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={playerState.isPlaying ? "Pause" : "Play"}
        >
          {playerState.isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          )}
        </button>

        {/* Time display */}
        <span className="text-xs text-zinc-400 font-mono tabular-nums whitespace-nowrap min-w-[80px]">
          {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-400">
            <path d="M2 5.5h2.5L8 2v12L4.5 10.5H2z" />
            {playerState.volume > 0 && (
              <path d="M11.5 5.5a4 4 0 010 5M10 7.5a1.5 1.5 0 010 1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            )}
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playerState.volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-[#8b5cf6] cursor-pointer"
          />
        </div>

        {/* Playback speed */}
        <div className="relative">
          <button
            onClick={() => setShowRateMenu((v) => !v)}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors font-mono"
          >
            {playerState.playbackRate}x
          </button>
          {showRateMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 glass-panel rounded-md py-1 z-50">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`block w-full text-xs px-3 py-1 text-left hover:bg-white/10 transition-colors font-mono ${
                    playerState.playbackRate === rate ? "text-[#8b5cf6]" : "text-zinc-400"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          aria-label="Fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h4v1.5H3.5V6H2zm8 0h4v4h-1.5V3.5H10zM2 10h1.5v2.5H6V14H2zm8 2.5V14h4v-4h-1.5v2.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
