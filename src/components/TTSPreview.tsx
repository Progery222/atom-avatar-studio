"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Download, X, Volume2 } from "lucide-react";

interface TTSPreviewProps {
  audioUrl: string | null;
  isGenerating: boolean;
  onAdd: () => void;
  onCancel: () => void;
  onDownload: () => void;
  error?: string | null;
}

export default function TTSPreview({
  audioUrl,
  isGenerating,
  onAdd,
  onCancel,
  onDownload,
  error,
}: TTSPreviewProps) {
  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/90">Генерация аудио...</span>
              </div>
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-gradient-to-r from-primary to-purple-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {audioUrl && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-200">Аудио готово</span>
              </div>
              <AudioPlayer url={audioUrl} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onAdd}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить к видео
              </button>
              <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-xs transition-colors"
                title="Скачать аудио"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onCancel}
                className="flex items-center justify-center p-2 hover:bg-white/10 text-white/40 hover:text-white/70 rounded-lg transition-colors"
                title="Отменить"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-red-300">{error}</span>
            <button onClick={onCancel} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Audio Player Component
function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2">
      <audio src={url} controls className="h-8 w-48" />
    </div>
  );
}
