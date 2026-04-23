"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  UserPlus,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import { useHyperFramesStore } from "@/lib/hyperframes/store";
import { saveComposition } from "@/lib/hyperframes/composition-manager";
import { importAvatarToHyperFrames } from "@/components/hyperframes/avatar-import";

import CodeEditor from "@/components/hyperframes/code-editor";
import Timeline from "@/components/hyperframes/timeline";
import PlayerPreview from "@/components/hyperframes/player-preview";
import Inspector from "@/components/hyperframes/inspector";
import BlockCatalog from "@/components/hyperframes/block-catalog";
import ShaderSelector from "@/components/hyperframes/shader-selector";
import TemplateGallery from "@/components/hyperframes/template-gallery";
import AudioManager from "@/components/hyperframes/audio-manager";
import ExportPanel from "@/components/hyperframes/export-panel";
import AvatarImport from "@/components/hyperframes/avatar-import";
import CompositionHistory from "@/components/hyperframes/composition-history";
import AIGeneratorView from "@/components/hyperframes/ai-generator-view";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { HYPERFRAMES_WIZARD_STEPS } from "@/components/onboarding/wizard-steps";
import { Tooltip, HintsToggle } from "@/components/onboarding/tooltip";
import { HYPERFRAMES_TOOLTIP_HINTS } from "@/components/onboarding/tooltip-hints";

type BottomTab = "inspector" | "blocks" | "shaders" | "audio" | "export";

const BOTTOM_TABS: { id: BottomTab; label: string; hfPanel?: string }[] = [
  { id: "inspector", label: "Inspector" },
  { id: "blocks", label: "Blocks", hfPanel: "catalog" },
  { id: "shaders", label: "Shaders", hfPanel: "shaders" },
  { id: "audio", label: "Audio" },
  { id: "export", label: "Export" },
];

export default function HyperFramesTab() {
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [bottomTab, setBottomTab] = useState<BottomTab>("inspector");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAvatarImport, setShowAvatarImport] = useState(false);

  const composition = useHyperFramesStore((s) => s.composition);
  const setIsDirty = useHyperFramesStore((s) => s.setIsDirty);

  const hasComposition = composition.id !== "";

  // Show template gallery on mount if no composition loaded
  useEffect(() => {
    if (!hasComposition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial UI state
      setShowTemplates(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for cross-tab import events
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ videoUrl: string }>;
      if (ce.detail?.videoUrl) {
        importAvatarToHyperFrames(ce.detail.videoUrl);
      }
    };
    window.addEventListener("import-to-hyperframes", handler);
    return () => window.removeEventListener("import-to-hyperframes", handler);
  }, []);

  const handleSave = useCallback(() => {
    saveComposition(composition);
    setIsDirty(false);
  }, [composition, setIsDirty]);

  const handleUndo = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    );
  }, []);

  const handleRedo = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] gap-1 p-2">
      {/* ── Toolbar ── */}
      <div className="hf-toolbar shrink-0 flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="New composition"
        >
          <FilePlus className="w-4 h-4" />
          New
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="Open composition"
        >
          <FolderOpen className="w-4 h-4" />
          Open
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="Save (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={handleUndo}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <div className="flex bg-black/20 p-0.5 rounded-lg mx-2 border border-white/5">
          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === "manual" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            Manual Editor
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              mode === "ai" ? "bg-purple-600/30 text-purple-200 shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3" /> AI Generate
          </button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={() => setShowAvatarImport(true)}
          data-hf="import"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded transition-colors"
          title="Import avatar video"
        >
          <UserPlus className="w-4 h-4" />
          Import Avatar
        </button>

        <button
          onClick={() => {
            setMode("manual");
            setBottomTab("export");
          }}
          data-hf="render"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs ml-auto bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 border border-[#8b5cf6]/30 rounded transition-colors"
          title="Render video"
        >
          <MonitorPlay className="w-4 h-4" />
          Render
        </button>
        <HintsToggle />
      </div>

      {mode === "ai" ? (
        <AIGeneratorView 
          onSendToManual={() => setMode("manual")}
          onRender={() => {
            setMode("manual");
            setBottomTab("export");
          }}
        />
      ) : (
        <>
          {/* ── Editor + Preview (side by side) ── */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-[300px] gap-1">
            <div className="flex-1 min-h-[200px] lg:min-h-0 min-w-0 relative" data-hint="code-editor">
              <span className="absolute top-1 right-1 z-10"><Tooltip text={HYPERFRAMES_TOOLTIP_HINTS.find(h => h.id === 'code-editor')?.text ?? ''} id="code-editor" /></span>
              <CodeEditor />
            </div>
            <div className="flex-1 min-h-[200px] lg:min-h-0 relative" data-hf="player" data-hint="player">
              <span className="absolute top-1 right-1 z-10"><Tooltip text={HYPERFRAMES_TOOLTIP_HINTS.find(h => h.id === 'player')?.text ?? ''} id="player" /></span>
              <PlayerPreview />
            </div>
          </div>

          {/* ── Timeline (full width) ── */}
          <div className="h-72 shrink-0 glass-panel rounded-lg overflow-hidden hf-timeline relative" data-hint="timeline">
            <span className="absolute top-1 right-1 z-10"><Tooltip text={HYPERFRAMES_TOOLTIP_HINTS.find(h => h.id === 'timeline')?.text ?? ''} id="timeline" /></span>
            <Timeline />
          </div>

          {/* ── Bottom Tabbed Panel ── */}
          <div className="flex flex-col h-[500px] glass-panel rounded-lg overflow-hidden">
            {/* Tab bar */}
            <div className="hf-toolbar shrink-0 flex items-center gap-0.5 px-1 border-b border-white/5">
              {BOTTOM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBottomTab(tab.id)}
                  {...(tab.hfPanel ? { 'data-hf-panel': tab.hfPanel } : {})}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
                    bottomTab === tab.id
                      ? "bg-[#8b5cf6]/20 text-[#8b5cf6] border-b-2 border-[#8b5cf6]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {bottomTab === "inspector" && <Inspector />}
              {bottomTab === "blocks" && <BlockCatalog />}
              {bottomTab === "shaders" && <ShaderSelector />}
              {bottomTab === "audio" && <AudioManager />}
              {bottomTab === "export" && <ExportPanel />}
            </div>
          </div>
        </>
      )}

      {/* ── Overlays ── */}
      <TemplateGallery
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
      />

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg max-h-[70vh] mx-4 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CompositionHistory />
          </div>
        </div>
      )}

      {showAvatarImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAvatarImport(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg max-h-[70vh] mx-4 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AvatarImport />
          </div>
        </div>
      )}

      <OnboardingWizard
        steps={HYPERFRAMES_WIZARD_STEPS}
        onComplete={() => useHyperFramesStore.getState().completeOnboarding()}
        storageKey="hyperframes_onboarding"
      />
    </div>
  );
}

