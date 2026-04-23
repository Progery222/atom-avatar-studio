'use client';

import { useState, useCallback } from 'react';
import { useHyperFramesStore } from '@/lib/hyperframes/store';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  text: string;
  id: string;
  placement?: Placement;
}

const DISMISSED_KEY = (id: string) => `hf_tooltip_${id}_dismissed`;

function isDismissed(id: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DISMISSED_KEY(id)) === 'true';
}

function dismissTooltip(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISMISSED_KEY(id), 'true');
}

const PLACEMENT_STYLES: Record<Placement, React.CSSProperties> = {
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px',
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: '8px',
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: '8px',
  },
};

export function Tooltip({ text, id, placement = 'top' }: TooltipProps) {
  const tooltipsEnabled = useHyperFramesStore((s) => s.tooltipsEnabled);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissed(id));

  const handleDismiss = useCallback(() => {
    dismissTooltip(id);
    setDismissed(true);
    setVisible(false);
  }, [id]);

  if (!tooltipsEnabled || dismissed) return null;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-help select-none"
        style={{
          background: 'rgba(139, 92, 246, 0.3)',
          color: '#c4b5fd',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          lineHeight: 1,
        }}
      >
        ⓘ
      </span>

      {visible && (
        <span
          className="hf-tooltip"
          style={PLACEMENT_STYLES[placement]}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block pr-5">{text}</span>
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            style={{ fontSize: '10px', lineHeight: 1 }}
          >
            ✕
          </button>
        </span>
      )}
    </span>
  );
}

export function HintsToggle() {
  const tooltipsEnabled = useHyperFramesStore((s) => s.tooltipsEnabled);
  const toggleTooltips = useHyperFramesStore((s) => s.toggleTooltips);

  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 transition-colors select-none">
      <input
        type="checkbox"
        checked={tooltipsEnabled}
        onChange={toggleTooltips}
        className="h-3 w-3 rounded border-zinc-600 bg-zinc-800 text-violet-500 accent-violet-500"
      />
      Show Hints
    </label>
  );
}
