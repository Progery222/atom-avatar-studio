'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHyperFramesStore } from '@/lib/hyperframes/store';
import type { Clip, Track } from '@/types/hyperframes';

const TRACK_HEADER_WIDTH = 160;
const TRACK_HEIGHT = 48;
const RULER_HEIGHT = 28;
const PIXELS_PER_SECOND_BASE = 80;
const CLIP_MIN_DURATION = 0.1;
const EDGE_HANDLE_WIDTH = 6;

type ClipType = 'video' | 'audio' | 'overlay' | 'text';

function clipTypeFromTrack(track: Track): ClipType {
  return track.type;
}

function clipColorClass(type: ClipType): string {
  switch (type) {
    case 'video': return 'hf-clip-video';
    case 'audio': return 'hf-clip-audio';
    case 'overlay': return 'hf-clip-overlay';
    case 'text': return 'hf-clip-text';
  }
}

function clipBorderColor(type: ClipType): string {
  switch (type) {
    case 'video': return '#8b5cf6';
    case 'audio': return '#06b6d4';
    case 'overlay': return '#10b981';
    case 'text': return '#f59e0b';
  }
}

interface ContextMenuState {
  x: number;
  y: number;
  clipId: string;
  trackId: string;
}

type DragMode = 'move' | 'resize-left' | 'resize-right' | 'playhead' | null;

interface DragState {
  mode: DragMode;
  clipId: string;
  trackId: string;
  startMouseX: number;
  originalStartTime: number;
  originalDuration: number;
}

export default function Timeline() {
  const composition = useHyperFramesStore((s) => s.composition);
  const updateComposition = useHyperFramesStore((s) => s.updateComposition);
  const selectedClipId = useHyperFramesStore((s) => s.selectedClipId);
  const setSelectedClipId = useHyperFramesStore((s) => s.setSelectedClipId);
  const timelineZoom = useHyperFramesStore((s) => s.timelineZoom);
  const setTimelineZoom = useHyperFramesStore((s) => s.setTimelineZoom);
  const playerState = useHyperFramesStore((s) => s.playerState);
  const setPlayerState = useHyperFramesStore((s) => s.setPlayerState);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const pxPerSec = PIXELS_PER_SECOND_BASE * timelineZoom;
  const totalWidth = Math.max(composition.duration * pxPerSec, 400);
  const playheadX = playerState.currentTime * pxPerSec;

  const timeToX = useCallback((t: number) => t * pxPerSec, [pxPerSec]);
  const xToTime = useCallback((x: number) => Math.max(0, Math.min(composition.duration, x / pxPerSec)), [pxPerSec, composition.duration]);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // Global mouse move/up for drag
  useEffect(() => {
    if (!drag) return;
    const d = drag;
    dragRef.current = d;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - d.startMouseX;
      const dt = dx / pxPerSec;

      const tracks = composition.tracks.map((track) => {
        if (track.id !== d.trackId) return track;
        return {
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== d.clipId) return clip;
            if (d.mode === 'move') {
              const newStart = Math.max(0, Math.min(composition.duration - clip.duration, d.originalStartTime + dt));
              return { ...clip, startTime: Math.round(newStart * 1000) / 1000 };
            }
            if (d.mode === 'resize-left') {
              const newStart = Math.max(0, d.originalStartTime + dt);
              const maxStart = d.originalStartTime + d.originalDuration - CLIP_MIN_DURATION;
              const clampedStart = Math.min(newStart, maxStart);
              const newDuration = d.originalDuration - (clampedStart - d.originalStartTime);
              return { ...clip, startTime: Math.round(clampedStart * 1000) / 1000, duration: Math.round(newDuration * 1000) / 1000 };
            }
            if (d.mode === 'resize-right') {
              const newDuration = Math.max(CLIP_MIN_DURATION, d.originalDuration + dt);
              const clampedDuration = Math.min(newDuration, composition.duration - d.originalStartTime);
              return { ...clip, duration: Math.round(clampedDuration * 1000) / 1000 };
            }
            return clip;
          }),
        };
      });
      updateComposition({ tracks });
    };

    const onUp = () => {
      setDrag(null);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, pxPerSec, composition.duration, composition.tracks, updateComposition]);

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip, track: Track, mode: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();
    if (track.locked) return;
    setSelectedClipId(clip.id);
    setDrag({
      mode,
      clipId: clip.id,
      trackId: track.id,
      startMouseX: e.clientX,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
    });
  };

  const handleClipContextMenu = (e: React.MouseEvent, clip: Clip, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    if (track.locked) return;
    setSelectedClipId(clip.id);
    setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id, trackId: track.id });
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startTime = playerState.currentTime;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const newTime = Math.max(0, Math.min(composition.duration, startTime + dx / pxPerSec));
      setPlayerState({ currentTime: Math.round(newTime * 1000) / 1000 });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleRulerClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = xToTime(x);
    setPlayerState({ currentTime: t });
  };

  const deleteClip = (clipId: string, trackId: string) => {
    const tracks = composition.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return { ...track, clips: track.clips.filter((c) => c.id !== clipId) };
    });
    updateComposition({ tracks });
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const duplicateClip = (clipId: string, trackId: string) => {
    const tracks = composition.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const source = track.clips.find((c) => c.id === clipId);
      if (!source) return track;
      const newClip: Clip = {
        ...source,
        id: `clip-${Date.now()}`,
        startTime: Math.min(source.startTime + source.duration, composition.duration - source.duration),
      };
      return { ...track, clips: [...track.clips, newClip] };
    });
    updateComposition({ tracks });
  };

  const splitClip = (clipId: string, trackId: string) => {
    const tracks = composition.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const sourceIdx = track.clips.findIndex((c) => c.id === clipId);
      if (sourceIdx === -1) return track;
      const source = track.clips[sourceIdx];
      const splitTime = playerState.currentTime;
      if (splitTime <= source.startTime || splitTime >= source.startTime + source.duration) return track;
      const firstHalf: Clip = { ...source, duration: Math.round((splitTime - source.startTime) * 1000) / 1000 };
      const secondHalf: Clip = {
        ...source,
        id: `clip-${Date.now()}`,
        startTime: Math.round(splitTime * 1000) / 1000,
        duration: Math.round((source.startTime + source.duration - splitTime) * 1000) / 1000,
      };
      const newClips = [...track.clips];
      newClips.splice(sourceIdx, 1, firstHalf, secondHalf);
      return { ...track, clips: newClips };
    });
    updateComposition({ tracks });
  };

  const toggleTrackLock = (trackId: string) => {
    const tracks = composition.tracks.map((t) =>
      t.id === trackId ? { ...t, locked: !t.locked } : t
    );
    updateComposition({ tracks });
  };

  const toggleTrackVisibility = (trackId: string) => {
    const tracks = composition.tracks.map((t) =>
      t.id === trackId ? { ...t, visible: !t.visible } : t
    );
    updateComposition({ tracks });
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    const tracks = composition.tracks.map((t) =>
      t.id === trackId ? { ...t, volume } : t
    );
    updateComposition({ tracks });
  };

  const addTrack = () => {
    const trackCount = composition.tracks.length;
    const types: Array<Track['type']> = ['video', 'audio', 'overlay', 'text'];
    const type = types[trackCount % types.length];
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount + 1}`,
      type,
      clips: [],
      locked: false,
      visible: true,
      volume: 1,
    };
    updateComposition({ tracks: [...composition.tracks, newTrack] });
  };

  // Ruler tick marks
  const rulerTicks: Array<{ x: number; label: string; major: boolean }> = [];
  const step = timelineZoom >= 2 ? 0.5 : timelineZoom >= 0.5 ? 1 : 2;
  for (let t = 0; t <= composition.duration; t += step) {
    const major = t % (step * 2) === 0 || step >= 1;
    rulerTicks.push({ x: timeToX(t), label: `${t}s`, major });
  }

  return (
    <div className="hf-timeline flex flex-col">
      {/* Toolbar */}
      <div className="hf-toolbar mb-1 px-2 py-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">Timeline</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setTimelineZoom(timelineZoom / 1.3)}
              className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/5"
              title="Zoom out"
            >
              −
            </button>
            <input
              type="range"
              min={0.1}
              max={10}
              step={0.1}
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
              className="w-20 h-1 accent-purple-500 cursor-pointer"
            />
            <button
              onClick={() => setTimelineZoom(timelineZoom * 1.3)}
              className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/5"
              title="Zoom in"
            >
              +
            </button>
            <span className="text-[10px] text-zinc-500 w-10 text-right">{timelineZoom.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
        <div style={{ width: TRACK_HEADER_WIDTH + totalWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <div
            className="hf-ruler sticky top-0 z-20 border-b border-white/5"
            style={{ height: RULER_HEIGHT, marginLeft: TRACK_HEADER_WIDTH, width: totalWidth, position: 'relative', background: '#0f0f13' }}
            onClick={handleRulerClick}
          >
            {rulerTicks.map((tick) => (
              <div key={tick.label} className="absolute top-0 h-full" style={{ left: tick.x }}>
                <div className={`h-2 border-l ${tick.major ? 'border-zinc-500' : 'border-zinc-700'}`} />
                {tick.major && (
                  <span className="text-[9px] text-zinc-500 ml-1 select-none">{tick.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Tracks + Playhead container */}
          <div className="relative">
            {composition.tracks.map((track) => {
              const clipType = clipTypeFromTrack(track);
              return (
                <div key={track.id} className="hf-track flex" style={{ height: TRACK_HEIGHT }}>
                  {/* Track header */}
                  <div
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 border-r border-white/5 bg-[#0f0f13] z-10"
                    style={{ width: TRACK_HEADER_WIDTH }}
                  >
                    <button
                      onClick={() => toggleTrackVisibility(track.id)}
                      className={`text-xs p-0.5 rounded hover:bg-white/5 ${track.visible ? 'text-zinc-300' : 'text-zinc-600'}`}
                      title={track.visible ? 'Hide track' : 'Show track'}
                    >
                      {track.visible ? '👁' : '👁‍🗨'}
                    </button>
                    <button
                      onClick={() => toggleTrackLock(track.id)}
                      className={`text-xs p-0.5 rounded hover:bg-white/5 ${track.locked ? 'text-red-400' : 'text-zinc-400'}`}
                      title={track.locked ? 'Unlock track' : 'Lock track'}
                    >
                      {track.locked ? '🔒' : '🔓'}
                    </button>
                    <span className="text-[11px] text-zinc-300 truncate flex-1 select-none">{track.name}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={track.volume}
                      onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                      className="w-10 h-0.5 accent-purple-500 cursor-pointer"
                      title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                  </div>

                  {/* Track clips area */}
                  <div className="relative flex-1" style={{ width: totalWidth }}>
                    {track.clips.map((clip) => {
                      const isSelected = clip.id === selectedClipId;
                      const left = timeToX(clip.startTime);
                      const width = clip.duration * pxPerSec;
                      const colorCls = clipColorClass(clipType);
                      const borderClr = clipBorderColor(clipType);

                      return (
                        <div
                          key={clip.id}
                          className={`hf-clip ${colorCls} absolute top-1 bottom-1 ${isSelected ? 'hf-clip-selected ring-1 ring-white/30' : ''}`}
                          style={{
                            left,
                            width: Math.max(width, 4),
                            borderLeftColor: borderClr,
                            borderRightColor: borderClr,
                            borderLeftWidth: 2,
                            borderRightWidth: 2,
                            opacity: track.visible ? 1 : 0.4,
                          }}
                          onMouseDown={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const offsetX = e.clientX - rect.left;
                            if (offsetX < EDGE_HANDLE_WIDTH) {
                              handleClipMouseDown(e, clip, track, 'resize-left');
                            } else if (offsetX > rect.width - EDGE_HANDLE_WIDTH) {
                              handleClipMouseDown(e, clip, track, 'resize-right');
                            } else {
                              handleClipMouseDown(e, clip, track, 'move');
                            }
                          }}
                          onContextMenu={(e) => handleClipContextMenu(e, clip, track)}
                        >
                          {/* Left resize handle */}
                          <div
                            className="absolute left-0 top-0 bottom-0 cursor-col-resize"
                            style={{ width: EDGE_HANDLE_WIDTH }}
                            onMouseDown={(e) => handleClipMouseDown(e, clip, track, 'resize-left')}
                          />
                          {/* Clip label */}
                          <span className="truncate pointer-events-none text-zinc-200 leading-tight">
                            {clip.content || clip.id}
                          </span>
                          {/* Right resize handle */}
                          <div
                            className="absolute right-0 top-0 bottom-0 cursor-col-resize"
                            style={{ width: EDGE_HANDLE_WIDTH }}
                            onMouseDown={(e) => handleClipMouseDown(e, clip, track, 'resize-right')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="hf-playhead cursor-col-resize"
              style={{ left: TRACK_HEADER_WIDTH + playheadX }}
              onMouseDown={handlePlayheadMouseDown}
            >
              <div
                className="absolute -top-1 -left-1.5 w-4 h-3 rounded-sm"
                style={{ background: '#ef4444' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Track button */}
      <div className="flex border-t border-white/5" style={{ paddingLeft: 0 }}>
        <div className="flex-shrink-0 flex items-center px-2" style={{ width: TRACK_HEADER_WIDTH }}>
          <button
            onClick={addTrack}
            className="text-xs text-zinc-400 hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <span className="text-sm leading-none">+</span> Add Track
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 transition-colors"
            onClick={() => {
              deleteClip(contextMenu.clipId, contextMenu.trackId);
              setContextMenu(null);
            }}
          >
            Delete
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 transition-colors"
            onClick={() => {
              duplicateClip(contextMenu.clipId, contextMenu.trackId);
              setContextMenu(null);
            }}
          >
            Duplicate
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 transition-colors"
            onClick={() => {
              splitClip(contextMenu.clipId, contextMenu.trackId);
              setContextMenu(null);
            }}
          >
            Split at Playhead
          </button>
        </div>
      )}
    </div>
  );
}
