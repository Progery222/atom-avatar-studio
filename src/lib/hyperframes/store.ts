import { create } from 'zustand';
import type {
  Composition,
  PlayerState,
  RenderJob,
  RenderSettings,
} from '@/types/hyperframes';

const DEFAULT_COMPOSITION: Composition = {
  id: '',
  name: 'Untitled',
  html: '<div class="composition" style="width:1920px;height:1080px;background:#09090b;"></div>',
  css: '',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10,
  tracks: [
    { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
    { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], locked: false, visible: true, volume: 1 },
  ],
  metadata: { author: '', tags: [], description: '', templateId: null },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  format: 'mp4',
  resolution: '1080p',
  fps: 30,
  quality: 'high',
  codec: 'h264',
};

interface HyperFramesState {
  // Composition
  composition: Composition;
  setComposition: (composition: Composition) => void;
  updateComposition: (partial: Partial<Composition>) => void;

  // Editor
  editorHtml: string;
  editorCss: string;
  setEditorHtml: (html: string) => void;
  setEditorCss: (css: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  // Player
  playerState: PlayerState;
  setPlayerState: (state: Partial<PlayerState>) => void;

  // Render
  renderSettings: RenderSettings;
  setRenderSettings: (settings: Partial<RenderSettings>) => void;
  activeRenderJob: RenderJob | null;
  setActiveRenderJob: (job: RenderJob | null) => void;

  // UI
  activePanel: 'editor' | 'timeline' | 'catalog' | 'shaders' | 'templates' | 'audio' | 'export' | 'history';
  setActivePanel: (panel: HyperFramesState['activePanel']) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;

  // Onboarding
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  tooltipsEnabled: boolean;
  toggleTooltips: () => void;

  // Selected clip
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;

  // Zoom
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
}

export const useHyperFramesStore = create<HyperFramesState>((set) => ({
  // Composition
  composition: DEFAULT_COMPOSITION,
  setComposition: (composition) => set({ composition, isDirty: false }),
  updateComposition: (partial) =>
    set((state) => ({
      composition: { ...state.composition, ...partial, updatedAt: Date.now() },
      isDirty: true,
    })),

  // Editor
  editorHtml: DEFAULT_COMPOSITION.html,
  editorCss: DEFAULT_COMPOSITION.css,
  setEditorHtml: (html) =>
    set((state) => ({
      editorHtml: html,
      composition: { ...state.composition, html, updatedAt: Date.now() },
      isDirty: true,
    })),
  setEditorCss: (css) =>
    set((state) => ({
      editorCss: css,
      composition: { ...state.composition, css, updatedAt: Date.now() },
      isDirty: true,
    })),
  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  // Player
  playerState: {
    isPlaying: false,
    currentTime: 0,
    duration: 10,
    volume: 1,
    playbackRate: 1,
  },
  setPlayerState: (partial) =>
    set((state) => ({
      playerState: { ...state.playerState, ...partial },
    })),

  // Render
  renderSettings: DEFAULT_RENDER_SETTINGS,
  setRenderSettings: (settings) =>
    set((state) => ({
      renderSettings: { ...state.renderSettings, ...settings },
    })),
  activeRenderJob: null,
  setActiveRenderJob: (job) => set({ activeRenderJob: job }),

  // UI
  activePanel: 'editor',
  setActivePanel: (panel) => set({ activePanel: panel }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  inspectorOpen: false,
  setInspectorOpen: (open) => set({ inspectorOpen: open }),

  // Onboarding
  isOnboardingComplete: typeof window !== 'undefined'
    ? localStorage.getItem('hyperframes_onboarding_complete') === 'true'
    : false,
  completeOnboarding: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hyperframes_onboarding_complete', 'true');
    }
    set({ isOnboardingComplete: true });
  },
  resetOnboarding: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hyperframes_onboarding_complete');
    }
    set({ isOnboardingComplete: false });
  },
  tooltipsEnabled: true,
  toggleTooltips: () => set((state) => ({ tooltipsEnabled: !state.tooltipsEnabled })),

  // Selected clip
  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id }),

  // Zoom
  timelineZoom: 1,
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.1, Math.min(10, zoom)) }),
}));
