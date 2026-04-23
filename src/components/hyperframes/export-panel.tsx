"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Film, Loader2, RotateCcw, X } from "lucide-react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import { compositionToHtml } from "@/lib/hyperframes/composition-manager";
import type { RenderJob, RenderSettings } from "@/types/hyperframes";

const RESOLUTION_OPTIONS: { label: string; value: RenderSettings["resolution"] }[] = [
  { label: "720p (1280\u00d7720)", value: "720p" },
  { label: "1080p (1920\u00d71080)", value: "1080p" },
];

const FPS_OPTIONS: { label: string; value: RenderSettings["fps"] }[] = [
  { label: "24 fps", value: 24 },
  { label: "30 fps", value: 30 },
  { label: "60 fps", value: 60 },
];

const QUALITY_OPTIONS: { label: string; value: RenderSettings["quality"] }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

function statusLabel(status: RenderJob["status"]): string {
  switch (status) {
    case "queued":
      return "Queuing...";
    case "rendering":
      return "Rendering frames...";
    case "encoding":
      return "Encoding video...";
    case "done":
      return "Done!";
    case "error":
      return "Error";
  }
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ExportPanel() {
  const composition = useHyperFramesStore((s) => s.composition);
  const renderSettings = useHyperFramesStore((s) => s.renderSettings);
  const setRenderSettings = useHyperFramesStore((s) => s.setRenderSettings);
  const activeRenderJob = useHyperFramesStore((s) => s.activeRenderJob);
  const setActiveRenderJob = useHyperFramesStore((s) => s.setActiveRenderJob);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isRendering =
    activeRenderJob !== null &&
    (activeRenderJob.status === "queued" ||
      activeRenderJob.status === "rendering" ||
      activeRenderJob.status === "encoding");

  const isDone = activeRenderJob !== null && activeRenderJob.status === "done";
  const isError = activeRenderJob !== null && activeRenderJob.status === "error";

  // Timer for elapsed time display
  useEffect(() => {
    if (isRendering) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = activeRenderJob?.startedAt ?? Date.now();
      }
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRendering, activeRenderJob?.startedAt]);

  // Polling for job status
  const startPolling = useCallback(
    (jobId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/hyperframes/render/status?jobId=${encodeURIComponent(jobId)}`
          );
          const json = await res.json();
          if (json.success && json.data) {
            const job = json.data as RenderJob;
            setActiveRenderJob(job);
            if (job.status === "done" || job.status === "error") {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        } catch {
          // Network error - keep polling
        }
      }, 2000);
    },
    [setActiveRenderJob]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleRender = async () => {
    if (!composition) return;
    setIsStarting(true);
    setError(null);
    startTimeRef.current = 0;
    setElapsed(0);

    try {
      const compositionHtml = compositionToHtml(composition);
      const res = await fetch("/api/hyperframes/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionHtml,
          settings: renderSettings,
          duration: composition.duration,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Render failed");
        setIsStarting(false);
        return;
      }

      const jobId: string = json.data.jobId;
      const job: RenderJob = {
        id: jobId,
        compositionId: composition.id,
        status: "queued",
        progress: 0,
        outputUrl: null,
        error: null,
        startedAt: Date.now(),
        completedAt: null,
      };
      setActiveRenderJob(job);
      startTimeRef.current = Date.now();
      startPolling(jobId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setActiveRenderJob(null);
    startTimeRef.current = 0;
    setElapsed(0);
  };

  const handleRenderAgain = () => {
    setActiveRenderJob(null);
    startTimeRef.current = 0;
    setElapsed(0);
    setError(null);
  };

  const noComposition = !composition || composition.id === "";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Section 1: Render Settings */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          Render Settings
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Resolution */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Resolution</label>
            <select
              className="glass-input rounded-lg px-3 py-2 text-sm"
              value={renderSettings.resolution}
              onChange={(e) =>
                setRenderSettings({
                  resolution: e.target.value as RenderSettings["resolution"],
                })
              }
              disabled={isRendering}
            >
              {RESOLUTION_OPTIONS.map((opt) => (
                <option key={opt.value + opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* FPS */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">FPS</label>
            <select
              className="glass-input rounded-lg px-3 py-2 text-sm"
              value={renderSettings.fps}
              onChange={(e) =>
                setRenderSettings({
                  fps: Number(e.target.value) as RenderSettings["fps"],
                })
              }
              disabled={isRendering}
            >
              {FPS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quality */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Quality</label>
            <select
              className="glass-input rounded-lg px-3 py-2 text-sm"
              value={renderSettings.quality}
              onChange={(e) =>
                setRenderSettings({
                  quality: e.target.value as RenderSettings["quality"],
                })
              }
              disabled={isRendering}
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format (display only) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Format</label>
            <div className="glass-input rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed">
              MP4
            </div>
          </div>

          {/* Codec (display only) */}
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs text-white/50">Codec</label>
            <div className="glass-input rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed">
              H.264
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Render Button */}
      <button
        onClick={handleRender}
        disabled={noComposition || isRendering || isStarting}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-primary hover:bg-primary/90 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isStarting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting render...
          </>
        ) : (
          <>
            <Film className="w-4 h-4" />
            Render Video
          </>
        )}
      </button>

      {noComposition && !isRendering && (
        <p className="text-xs text-white/30 text-center">
          No composition loaded. Create one to start rendering.
        </p>
      )}

      {error && (
        <div className="glass-panel rounded-xl p-3 text-sm text-red-400 border-red-500/20">
          {error}
        </div>
      )}

      {/* Section 3: Progress */}
      {isRendering && activeRenderJob && (
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${activeRenderJob.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-primary animate-pulse">
              {statusLabel(activeRenderJob.status)}
            </span>
            <span className="text-white/50 tabular-nums">
              {activeRenderJob.progress}%
            </span>
          </div>

          {/* Elapsed timer */}
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <span className="tabular-nums">{formatElapsed(elapsed)}</span>
          </div>

          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="self-end flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      )}

      {/* Section 4: Result */}
      {isDone && activeRenderJob && activeRenderJob.outputUrl && (
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white/80">Result</h3>

          {/* Inline video player */}
          <video
            src={activeRenderJob.outputUrl}
            controls
            autoPlay
            loop
            className="w-full rounded-lg bg-black"
          />

          {/* File size / render time */}
          {activeRenderJob.completedAt && activeRenderJob.startedAt && (
            <div className="text-xs text-white/40">
              Rendered in{" "}
              {formatElapsed(activeRenderJob.completedAt - activeRenderJob.startedAt)}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href={activeRenderJob.outputUrl}
              download
              className="flex-1 py-2 rounded-lg text-sm font-medium text-center bg-primary/20 hover:bg-primary/30 text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>

            <button
              onClick={handleRenderAgain}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-center bg-white/5 hover:bg-white/10 text-white/70 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Render Again
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && activeRenderJob && (
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-3 border-red-500/20">
          <p className="text-sm text-red-400">
            {activeRenderJob.error ?? "Render failed"}
          </p>
          <button
            onClick={handleRenderAgain}
            className="self-start flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
