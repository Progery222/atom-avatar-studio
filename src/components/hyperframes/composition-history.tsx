"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  Check,
  Copy,
  Download,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import {
  deleteComposition,
  duplicateComposition,
  exportComposition,
  getHistory,
  loadComposition,
  saveComposition,
} from "@/lib/hyperframes/composition-manager";
import type { CompositionHistoryEntry } from "@/types/hyperframes";

type SortMode = "date" | "name";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CompositionHistory() {
  const composition = useHyperFramesStore((s) => s.composition);
  const setComposition = useHyperFramesStore((s) => s.setComposition);
  const setEditorHtml = useHyperFramesStore((s) => s.setEditorHtml);
  const setEditorCss = useHyperFramesStore((s) => s.setEditorCss);
  const isDirty = useHyperFramesStore((s) => s.isDirty);
  const setIsDirty = useHyperFramesStore((s) => s.setIsDirty);
  const setActivePanel = useHyperFramesStore((s) => s.setActivePanel);

  const [entries, setEntries] = useState<CompositionHistoryEntry[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshEntries = useCallback(() => {
    setEntries(getHistory());
  }, []);

  // Load entries on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data loading on mount
    refreshEntries();
  }, [refreshEntries]);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }

    if (isDirty && composition.id) {
      autoSaveRef.current = setInterval(() => {
        const currentComposition = useHyperFramesStore.getState().composition;
        const currentDirty = useHyperFramesStore.getState().isDirty;
        if (currentDirty && currentComposition.id) {
          saveComposition(currentComposition);
          setIsDirty(false);
          setLastSavedAt(Date.now());
          refreshEntries();
        }
      }, 30000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [isDirty, composition.id, setIsDirty, refreshEntries]);

  const handleOpen = useCallback(
    (id: string) => {
      const loaded = loadComposition(id);
      if (!loaded) return;

      setComposition(loaded);
      setEditorHtml(loaded.html);
      setEditorCss(loaded.css);
      setIsDirty(false);
      setLastSavedAt(Date.now());
      setActivePanel("editor");
    },
    [setComposition, setEditorHtml, setEditorCss, setIsDirty, setActivePanel]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const dup = duplicateComposition(id);
      if (dup) {
        refreshEntries();
      }
    },
    [refreshEntries]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteComposition(id);
      setDeleteConfirmId(null);
      refreshEntries();
    },
    [refreshEntries]
  );

  const handleExport = useCallback((id: string) => {
    const loaded = loadComposition(id);
    if (!loaded) return;

    const json = exportComposition(loaded);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${loaded.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortMode === "date") return b.lastModified - a.lastModified;
    return a.name.localeCompare(b.name);
  });

  const saveStatusText = isDirty
    ? "Unsaved changes"
    : lastSavedAt
      ? `Saved ${formatDate(lastSavedAt)}`
      : "Saved";

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            Compositions
          </h2>
          <span className="text-xs text-zinc-500">{entries.length} items</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          <span
            className={`text-xs flex items-center gap-1 ${
              isDirty ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {isDirty ? (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            {saveStatusText}
          </span>

          {/* Sort toggle */}
          <button
            onClick={() => setSortMode((m) => (m === "date" ? "name" : "date"))}
            className="glass-input px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <ArrowDownUp className="w-3 h-3" />
            {sortMode === "date" ? "By date" : "By name"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <p className="text-sm">
              No compositions saved yet.
            </p>
            <p className="text-xs text-zinc-600">
              Create one to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {sorted.map((entry) => {
              const isActive = entry.id === composition.id;
              const isConfirming = deleteConfirmId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`glass-panel rounded-lg px-3 py-2.5 transition-colors ${
                    isActive
                      ? "ring-1 ring-purple-500/50 bg-purple-500/10"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Row top: name + meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-zinc-200 truncate">
                        {entry.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(entry.lastModified)} ·{" "}
                        {formatDuration(entry.duration)} ·{" "}
                        {entry.trackCount}{" "}
                        {entry.trackCount === 1 ? "track" : "tracks"}
                      </span>
                    </div>

                    {isActive && (
                      <span className="text-[10px] text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Row bottom: actions */}
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => handleOpen(entry.id)}
                      className="glass-input px-2 py-1 text-xs text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Open"
                    >
                      <FolderOpen className="w-3 h-3" />
                      Open
                    </button>

                    <button
                      onClick={() => handleDuplicate(entry.id)}
                      className="glass-input px-2 py-1 text-xs text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                      Duplicate
                    </button>

                    <button
                      onClick={() => handleExport(entry.id)}
                      className="glass-input px-2 py-1 text-xs text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Export JSON"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-red-400">Delete?</span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="glass-input px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(entry.id)}
                        className="glass-input px-2 py-1 text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 ml-auto transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
