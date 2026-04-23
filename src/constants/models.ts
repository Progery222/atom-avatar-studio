export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: 'bytedance' | 'kling';
  type: 'integrated' | 'external-audio';
  creditPricePerSec?: number;
  pricing?: Record<string, number>;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  canUploadAudio: boolean;
  hasCameraEffects: boolean;
  hasAdvancedSeedanceSettings: boolean; // For emotion, dynamism, lighting
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'bytedance/seedance-2-fast',
    name: 'Seedance 2.0 Fast (720p/480p)',
    description: 'Быстрая модель со встроенной озвучкой. Рекомендуется 480p для скорости.',
    provider: 'bytedance',
    type: 'integrated',
    pricing: {
      '480p': 15.5,
      '720p': 33.0
    },
    supportedAspectRatios: ['9:16', '16:9', '1:1', '3:4', '4:3'],
    supportedResolutions: ['480p', '720p'],
    canUploadAudio: false,
    hasCameraEffects: false,
    hasAdvancedSeedanceSettings: true,
  },
  {
    id: 'kling/ai-avatar-standard',
    name: 'Kling Standard (720p)',
    description: 'Экономичная модель: 720p, без управления камерой.',
    provider: 'kling',
    type: 'external-audio',
    pricing: {
      '720p': 8.0
    },
    supportedAspectRatios: [], // Will be hidden
    supportedResolutions: ['720p'],
    canUploadAudio: true,
    hasCameraEffects: false,
    hasAdvancedSeedanceSettings: false,
  },
  {
    id: 'kling/ai-avatar-pro',
    name: 'Kling Pro (1080p)',
    description: 'Премиум модель: 1080p, управление камерой через промпт.',
    provider: 'kling',
    type: 'external-audio',
    pricing: {
      '1080p': 16.0,
      '720p': 16.0
    },
    supportedAspectRatios: [], // Will be hidden
    supportedResolutions: ['1080p', '720p'],
    canUploadAudio: true,
    hasCameraEffects: true,
    hasAdvancedSeedanceSettings: false,
  }
];

export const CAMERA_EFFECTS = [
  { id: 'static', name: 'Статичный', prompt: 'Static camera, professional studio shot, sharp focus.' },
  { id: 'zoom_in', name: 'Кино-зум', prompt: 'Slow smooth zoom into the subject face, dramatic focus.' },
  { id: 'pan', name: 'Панорама', prompt: 'Smooth camera panning from left to right, dynamic background.' },
  { id: 'handheld', name: 'Handheld', prompt: 'Slight handheld camera shake, realistic documentary style.' },
  { id: 'orbit', name: 'Орбита', prompt: 'Smooth orbital camera movement around the subject, rotating 3D perspective, highly detailed.' },
  { id: 'pulse', name: 'Пульсация', prompt: 'Subtle rhythmic breathing zoom in and out, cinematic pulsing motion, dynamic framing.' },
];
