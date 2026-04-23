"use client";

export interface HistoryItem {
  id: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  status: 'pending' | 'success' | 'fail';
  cost: number | null;
  provider?: 'kie' | 'heygen';
  inputImageUrl?: string;
  resultVideoUrl?: string | null;
  params: {
    emotion: string;
    camera: string;
    resolution: string;
    aspectRatio: string;
    duration: number;
    lighting?: string;
    voiceName?: string;
    removeBackground?: boolean;
    backgroundType?: 'color' | 'image' | 'none';
    backgroundValue?: string;
    voiceSpeed?: number;
    voicePitch?: number;
    expressiveness?: 'high' | 'medium' | 'low';
    motionPrompt?: string;
  };
}

const STORAGE_KEY = 'ai_avatar_history';

export const historyService = {
  getHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addItem(item: HistoryItem) {
    if (typeof window === 'undefined') return;
    const history = this.getHistory();
    const newHistory = [item, ...history].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  },

  updateItem(id: string, updates: Partial<HistoryItem>) {
    if (typeof window === 'undefined') return;
    const history = this.getHistory();
    const index = history.findIndex(h => h.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  },

  clearHistory() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
