export interface Composition {
  id: string;
  name: string;
  html: string;
  css: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  tracks: Track[];
  metadata: CompositionMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'text';
  clips: Clip[];
  locked: boolean;
  visible: boolean;
  volume: number;
}

export interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  type: 'html' | 'video' | 'audio' | 'image' | 'text';
  content: string;
  dataAttributes: DataAttributes;
  transitions: {
    in?: ShaderTransitionRef;
    out?: ShaderTransitionRef;
  };
}

export interface DataAttributes {
  'data-start'?: number;
  'data-duration'?: number;
  'data-track-index'?: number;
  'data-volume'?: number;
  'data-transition-in'?: string;
  'data-transition-out'?: string;
  'data-ease'?: string;
  'data-z-index'?: number;
  'data-background-color'?: string;
  [key: string]: string | number | undefined;
}

export interface Block {
  id: string;
  name: string;
  category: BlockCategory;
  description: string;
  html: string;
  css: string;
  thumbnail: string;
  tags: string[];
  author: string;
}

export type BlockCategory = 'social' | 'cinematic' | 'data-viz' | 'text' | 'transition' | 'overlay' | 'template';

export interface ShaderTransition {
  id: string;
  name: string;
  type: string;
  glslFragment: string;
  uniforms: Record<string, number | number[]>;
  duration: number;
  thumbnail: string;
}

export interface ShaderTransitionRef {
  shaderId: string;
  duration: number;
  uniforms?: Record<string, number | number[]>;
}

export interface RenderJob {
  id: string;
  compositionId: string;
  status: 'queued' | 'rendering' | 'encoding' | 'done' | 'error';
  progress: number;
  outputUrl: string | null;
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

export interface RenderSettings {
  format: 'mp4' | 'webm';
  resolution: '480p' | '720p' | '1080p';
  fps: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high';
  codec: 'h264' | 'h265' | 'vp9';
}

export interface CompositionMetadata {
  author: string;
  tags: string[];
  description: string;
  templateId: string | null;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export interface CompositionHistoryEntry {
  id: string;
  name: string;
  lastModified: number;
  duration: number;
  trackCount: number;
  thumbnail: string | null;
}
