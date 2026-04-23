"use client";

import { useState, useCallback } from "react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import type { Clip, DataAttributes } from "@/types/hyperframes";

const EASE_OPTIONS = ["none", "ease-in", "ease-out", "ease-in-out", "linear"] as const;
const FPS_OPTIONS = [24, 30, 60] as const;

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 pb-3">
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
    >
      {title}
      <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
        ▾
      </span>
    </button>
    {open && <div className="mt-2 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

const CLIP_TYPE_COLORS: Record<Clip["type"], string> = {
  html: "bg-zinc-600",
  video: "bg-purple-600/60",
  audio: "bg-cyan-600/60",
  image: "bg-emerald-600/60",
  text: "bg-amber-600/60",
};

function ClipInspector({ clip }: { clip: Clip }) {
  const updateComposition = useHyperFramesStore((s) => s.updateComposition);
  const composition = useHyperFramesStore((s) => s.composition);

  const updateDataAttr = useCallback(
    (key: keyof DataAttributes, value: string | number | undefined) => {
      const tracks = composition.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((c) =>
          c.id === clip.id
            ? { ...c, dataAttributes: { ...c.dataAttributes, [key]: value } }
            : c
        ),
      }));
      updateComposition({ tracks });
    },
    [clip.id, composition.tracks, updateComposition]
  );

  const da = clip.dataAttributes;

  return (
    <>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-200">Clip Properties</h3>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase text-white ${CLIP_TYPE_COLORS[clip.type]}`}>
          {clip.type}
        </span>
      </div>

      <Section title="Timing">
        <Field label="data-start">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={da["data-start"] ?? ""}
            onChange={(e) => updateDataAttr("data-start", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </Field>
        <Field label="data-duration">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={da["data-duration"] ?? ""}
            onChange={(e) => updateDataAttr("data-duration", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </Field>
        <Field label="data-track-index">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={da["data-track-index"] ?? ""}
            onChange={(e) => updateDataAttr("data-track-index", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </Field>
      </Section>

      <Section title="Audio">
        <Field label="data-volume">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              className="flex-1 accent-purple-500"
              value={da["data-volume"] ?? 1}
              onChange={(e) => updateDataAttr("data-volume", Number(e.target.value))}
            />
            <span className="text-xs text-zinc-400 w-8 text-right">
              {Math.round((da["data-volume"] ?? 1) * 100)}%
            </span>
          </div>
        </Field>
      </Section>

      <Section title="Easing">
        <Field label="data-ease">
          <select
            className="glass-input rounded px-2 py-1 text-sm"
            value={da["data-ease"] ?? "none"}
            onChange={(e) => updateDataAttr("data-ease", e.target.value)}
          >
            {EASE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Transitions">
        <Field label="data-transition-in">
          <input
            type="text"
            className="glass-input rounded px-2 py-1 text-sm"
            placeholder="Shader ID"
            value={da["data-transition-in"] ?? ""}
            onChange={(e) => updateDataAttr("data-transition-in", e.target.value || undefined)}
          />
        </Field>
        <Field label="data-transition-out">
          <input
            type="text"
            className="glass-input rounded px-2 py-1 text-sm"
            placeholder="Shader ID"
            value={da["data-transition-out"] ?? ""}
            onChange={(e) => updateDataAttr("data-transition-out", e.target.value || undefined)}
          />
        </Field>
      </Section>
    </>
  );
}

function CompositionInspector() {
  const composition = useHyperFramesStore((s) => s.composition);
  const updateComposition = useHyperFramesStore((s) => s.updateComposition);

  const bgColorMatch = composition.html.match(/background:\s*(#[0-9a-fA-F]{3,8})/);
  const bgColor = bgColorMatch?.[1] ?? "#09090b";

  const updateBgColor = useCallback(
    (color: string) => {
      const html = composition.html.replace(
        /background:\s*#[0-9a-fA-F]{3,8}/,
        `background:${color}`
      );
      updateComposition({ html });
    },
    [composition.html, updateComposition]
  );

  return (
    <>
      <h3 className="text-sm font-semibold text-zinc-200">Composition</h3>

      <Section title="General">
        <Field label="Name">
          <input
            type="text"
            className="glass-input rounded px-2 py-1 text-sm"
            value={composition.name}
            onChange={(e) => updateComposition({ name: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Dimensions">
        <Field label="Width">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={composition.width}
            onChange={(e) => updateComposition({ width: Number(e.target.value) })}
          />
        </Field>
        <Field label="Height">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={composition.height}
            onChange={(e) => updateComposition({ height: Number(e.target.value) })}
          />
        </Field>
      </Section>

      <Section title="Playback">
        <Field label="FPS">
          <select
            className="glass-input rounded px-2 py-1 text-sm"
            value={composition.fps}
            onChange={(e) => updateComposition({ fps: Number(e.target.value) })}
          >
            {FPS_OPTIONS.map((fps) => (
              <option key={fps} value={fps}>{fps}</option>
            ))}
          </select>
        </Field>
        <Field label="Duration (s)">
          <input
            type="number"
            className="glass-input rounded px-2 py-1 text-sm"
            value={composition.duration}
            onChange={(e) => updateComposition({ duration: Number(e.target.value) })}
          />
        </Field>
      </Section>

      <Section title="Appearance">
        <Field label="Background">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
              value={bgColor}
              onChange={(e) => updateBgColor(e.target.value)}
            />
            <input
              type="text"
              className="glass-input rounded px-2 py-1 text-sm flex-1"
              value={bgColor}
              onChange={(e) => updateBgColor(e.target.value)}
            />
          </div>
        </Field>
      </Section>
    </>
  );
}

export default function Inspector() {
  const selectedClipId = useHyperFramesStore((s) => s.selectedClipId);
  const composition = useHyperFramesStore((s) => s.composition);

  const selectedClip = selectedClipId
    ? composition.tracks
        .flatMap((t) => t.clips)
        .find((c) => c.id === selectedClipId) ?? null
    : null;

  return (
    <div className="hf-inspector">
      {selectedClip ? (
        <ClipInspector clip={selectedClip} />
      ) : (
        <CompositionInspector />
      )}
    </div>
  );
}
