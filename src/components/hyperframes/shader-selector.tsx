'use client';

import { useState, useCallback, useMemo } from 'react';
import { Zap, ArrowRightToLine, ArrowLeftFromLine, Check, Play } from 'lucide-react';
import { SHADER_TRANSITIONS } from '@/constants/hyperframes/shaders';
import { useHyperFramesStore } from '@/lib/hyperframes/store';
import type { Clip, Composition } from '@/types/hyperframes';

type TransitionTab = 'in' | 'out';

function findClip(composition: Composition, clipId: string): Clip | null {
  for (const track of composition.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return clip;
  }
  return null;
}

function updateClipInComposition(
  composition: Composition,
  clipId: string,
  updates: Partial<Clip>,
): Composition {
  return {
    ...composition,
    tracks: composition.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...updates } : clip,
      ),
    })),
    updatedAt: Date.now(),
  };
}

const SHADER_ANIMATIONS: Record<string, string> = {
  'domain-warp': 'shader-domain-warp',
  'glitch': 'shader-glitch',
  'light-leak': 'shader-light-leak',
  'ripple-waves': 'shader-ripple-waves',
  'cross-fade': 'shader-cross-fade',
  'wipe-right': 'shader-wipe-right',
  'zoom-blur': 'shader-zoom-blur',
  'pixelate': 'shader-pixelate',
  'circle-reveal': 'shader-circle-reveal',
  'dissolve': 'shader-dissolve',
  'slide-up': 'shader-slide-up',
  'chromatic-aberration': 'shader-chromatic-aberration',
  'flash-white': 'shader-flash-white',
  'ink-spread': 'shader-ink-spread',
  'kaleidoscope': 'shader-kaleidoscope',
};

function ShaderThumbnail({ shaderId, isHovered }: { shaderId: string; isHovered: boolean }) {
  const animName = SHADER_ANIMATIONS[shaderId];

  return (
    <div className="relative w-full h-20 rounded-md overflow-hidden bg-zinc-800">
      {/* Base gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />
      {/* Animated overlay layer */}
      <div
        className="absolute inset-0"
        style={{
          animation: isHovered && animName ? `${animName} 1.5s ease-in-out infinite` : 'none',
        }}
      />
      {/* Play hint when not hovered */}
      {!isHovered && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Play className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

export default function ShaderSelector() {
  const [selectedShaderId, setSelectedShaderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TransitionTab>('in');
  const [hoveredShaderId, setHoveredShaderId] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const { composition, selectedClipId, updateComposition } = useHyperFramesStore();

  const selectedClip = useMemo(
    () => (selectedClipId ? findClip(composition, selectedClipId) : null),
    [composition, selectedClipId],
  );

  const currentTransitionOnClip = useMemo(() => {
    if (!selectedClip) return null;
    return activeTab === 'in'
      ? selectedClip.dataAttributes['data-transition-in']
      : selectedClip.dataAttributes['data-transition-out'];
  }, [selectedClip, activeTab]);

  const handleApply = useCallback(() => {
    if (!selectedShaderId || !selectedClipId) return;

    const attrKey = activeTab === 'in' ? 'data-transition-in' : 'data-transition-out';
    const updatedComposition = updateClipInComposition(composition, selectedClipId, {
      dataAttributes: {
        ...findClip(composition, selectedClipId)?.dataAttributes,
        [attrKey]: selectedShaderId,
      },
    });

    updateComposition(updatedComposition);
    setAppliedFeedback(selectedShaderId);
    setTimeout(() => setAppliedFeedback(null), 1500);
  }, [selectedShaderId, selectedClipId, activeTab, composition, updateComposition]);

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes shader-domain-warp {
          0%, 100% { transform: translateX(0) skewX(0deg); opacity: 0.7; }
          25% { transform: translateX(3px) skewX(2deg); opacity: 0.9; }
          50% { transform: translateX(-3px) skewX(-2deg); opacity: 1; }
          75% { transform: translateX(2px) skewX(1deg); opacity: 0.8; }
        }
        @keyframes shader-glitch {
          0%, 100% { transform: translateX(0); filter: none; }
          10% { transform: translateX(-4px); filter: hue-rotate(90deg); }
          20% { transform: translateX(3px); }
          30% { transform: translateX(-2px); filter: hue-rotate(180deg); }
          40% { transform: translateX(0); }
          60% { transform: translateX(5px); filter: hue-rotate(270deg); }
          70% { transform: translateX(-3px); }
        }
        @keyframes shader-light-leak {
          0%, 100% { background: transparent; }
          30% { background: linear-gradient(105deg, transparent 30%, rgba(255,220,150,0.6) 50%, transparent 70%); }
          50% { background: linear-gradient(105deg, transparent 20%, rgba(255,200,100,0.8) 45%, transparent 65%); }
          70% { background: linear-gradient(105deg, transparent 40%, rgba(255,180,80,0.4) 55%, transparent 75%); }
        }
        @keyframes shader-ripple-waves {
          0% { transform: scale(0.3); opacity: 0.8; border-radius: 50%; border: 2px solid rgba(139,92,246,0.6); }
          50% { transform: scale(1.2); opacity: 0.4; border-radius: 50%; border: 2px solid rgba(139,92,246,0.3); }
          100% { transform: scale(0.3); opacity: 0.8; border-radius: 50%; border: 2px solid rgba(139,92,246,0.6); }
        }
        @keyframes shader-cross-fade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes shader-wipe-right {
          0% { clip-path: inset(0 100% 0 0); }
          50% { clip-path: inset(0 0% 0 0); }
          100% { clip-path: inset(0 100% 0 0); }
        }
        @keyframes shader-zoom-blur {
          0%, 100% { transform: scale(1); filter: blur(0px); }
          50% { transform: scale(1.15); filter: blur(2px); }
        }
        @keyframes shader-pixelate {
          0%, 100% { filter: blur(0px); transform: scale(1); }
          25% { filter: blur(1px); transform: scale(1.02); }
          50% { filter: blur(3px); transform: scale(1.05); }
          75% { filter: blur(1px); transform: scale(1.02); }
        }
        @keyframes shader-circle-reveal {
          0% { clip-path: circle(0% at 50% 50%); }
          50% { clip-path: circle(75% at 50% 50%); }
          100% { clip-path: circle(0% at 50% 50%); }
        }
        @keyframes shader-dissolve {
          0%, 100% { opacity: 1; filter: contrast(1); }
          25% { opacity: 0.6; filter: contrast(1.5) brightness(1.2); }
          50% { opacity: 0.3; filter: contrast(2) brightness(1.5); }
          75% { opacity: 0.6; filter: contrast(1.5) brightness(1.2); }
        }
        @keyframes shader-slide-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }
        @keyframes shader-chromatic-aberration {
          0%, 100% { text-shadow: 0 0 transparent; filter: none; }
          25% { text-shadow: -2px 0 rgba(255,0,0,0.5), 2px 0 rgba(0,255,255,0.5); filter: none; }
          50% { text-shadow: -4px 0 rgba(255,0,0,0.7), 4px 0 rgba(0,255,255,0.7); filter: saturate(1.5); }
          75% { text-shadow: -2px 0 rgba(255,0,0,0.5), 2px 0 rgba(0,255,255,0.5); filter: none; }
        }
        @keyframes shader-flash-white {
          0%, 100% { background: transparent; }
          40% { background: rgba(255,255,255,0.9); }
          60% { background: rgba(255,255,255,0.6); }
        }
        @keyframes shader-ink-spread {
          0% { clip-path: circle(0% at 50% 50%); background: rgba(20,20,30,0.9); }
          50% { clip-path: circle(80% at 50% 50%); background: rgba(20,20,30,0.5); }
          100% { clip-path: circle(0% at 50% 50%); background: rgba(20,20,30,0.9); }
        }
        @keyframes shader-kaleidoscope {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(60deg) scale(0.9); }
          50% { transform: rotate(120deg) scale(1.1); }
          75% { transform: rotate(180deg) scale(0.95); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Zap className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Shader Transitions</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('in')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'in'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowRightToLine className="w-3.5 h-3.5" />
          Transition In
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'out'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowLeftFromLine className="w-3.5 h-3.5" />
          Transition Out
        </button>
      </div>

      {/* Shader Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2.5">
          {SHADER_TRANSITIONS.map((shader) => {
            const isSelected = selectedShaderId === shader.id;
            const isActiveOnClip = currentTransitionOnClip === shader.id;
            const isHovered = hoveredShaderId === shader.id;

            return (
              <button
                key={shader.id}
                onClick={() => setSelectedShaderId(shader.id)}
                onMouseEnter={() => setHoveredShaderId(shader.id)}
                onMouseLeave={() => setHoveredShaderId(null)}
                className={`group relative rounded-lg border text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                    : isActiveOnClip
                      ? 'border-purple-500/40 bg-purple-500/5'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {/* Thumbnail */}
                <ShaderThumbnail shaderId={shader.id} isHovered={isHovered} />

                {/* Card content */}
                <div className="px-2.5 py-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {shader.name}
                    </span>
                    {isActiveOnClip && (
                      <Check className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300">
                      {shader.type}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {shader.duration}s
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply Bar */}
      <div className="px-4 py-3 border-t border-white/10 bg-zinc-950/50">
        {!selectedClipId ? (
          <p className="text-xs text-zinc-500 text-center">
            Select a clip to apply transitions
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 truncate">
                {selectedClip?.content || selectedClipId}
              </p>
              <p className="text-[10px] text-zinc-600">
                {activeTab === 'in' ? 'Transition In' : 'Transition Out'}
                {currentTransitionOnClip ? `: ${currentTransitionOnClip}` : ': none'}
              </p>
            </div>
            <button
              onClick={handleApply}
              disabled={!selectedShaderId}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedShaderId
                  ? appliedFeedback === selectedShaderId
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:text-purple-200'
                  : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              {appliedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Applied
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Apply
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
