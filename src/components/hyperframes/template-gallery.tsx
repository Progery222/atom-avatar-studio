'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Clock, Layers, Monitor, Smartphone } from 'lucide-react'
import { STARTER_TEMPLATES } from '@/constants/hyperframes/templates'
import type { StarterTemplate } from '@/constants/hyperframes/templates'
import { useHyperFramesStore } from '@/lib/hyperframes/store'
import { createComposition, saveComposition } from '@/lib/hyperframes/composition-manager'

interface TemplateGalleryProps {
  open: boolean
  onClose: () => void
}

function ResolutionIcon({ width, height }: { width: number; height: number }) {
  if (height > width) return <Smartphone className="w-3 h-3" />
  return <Monitor className="w-3 h-3" />
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: StarterTemplate
  onSelect: (t: StarterTemplate) => void
}) {
  const comp = template.composition

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(template)}
      className="group glass-panel rounded-xl p-0 overflow-hidden text-left hover:border-purple-500/40 transition-colors cursor-pointer"
    >
      <div className="aspect-video bg-zinc-900/80 border-b border-white/5 flex items-center justify-center overflow-hidden relative">
        <div
          className="transform scale-[0.08] origin-center pointer-events-none"
          style={{ width: comp.width, height: comp.height }}
          dangerouslySetInnerHTML={{ __html: comp.html + `<style>${comp.css}</style>` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium">
            Use Template
          </span>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-medium text-white truncate">{template.name}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{template.description}</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {comp.duration}s
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {comp.tracks.length}
          </span>
          <span className="flex items-center gap-1">
            <ResolutionIcon width={comp.width} height={comp.height} />
            {comp.width}×{comp.height}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

function BlankCard({ onSelect }: { onSelect: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className="group glass-panel rounded-xl p-0 overflow-hidden text-left hover:border-purple-500/40 transition-colors cursor-pointer"
    >
      <div className="aspect-video bg-zinc-900/80 border-b border-white/5 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-600 group-hover:border-purple-500 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-medium text-white">Blank</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">Start from scratch with an empty composition</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            5s
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            1
          </span>
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            1920×1080
          </span>
        </div>
      </div>
    </motion.button>
  )
}

export default function TemplateGallery({ open, onClose }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { setComposition, setEditorHtml, setEditorCss } = useHyperFramesStore()

  const filteredTemplates = STARTER_TEMPLATES.filter((t) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.composition.metadata.tags.some((tag) => tag.includes(q))
    )
  })

  function handleSelectTemplate(template: StarterTemplate) {
    const composition = createComposition(template.composition)
    composition.metadata.templateId = template.id

    saveComposition(composition)
    setComposition(composition)
    setEditorHtml(composition.html)
    setEditorCss(composition.css)
    onClose()
  }

  function handleSelectBlank() {
    const composition = createComposition({
      name: 'Untitled',
      html: '<div class="composition" style="width:1920px;height:1080px;background:#09090b;"></div>',
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: [], description: '', templateId: null },
    })

    saveComposition(composition)
    setComposition(composition)
    setEditorHtml(composition.html)
    setEditorCss(composition.css)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel rounded-2xl w-full max-w-3xl max-h-[85vh] mx-4 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-semibold text-white">Choose a Template</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Start with a preset or begin from scratch</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-white/5">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
              />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <BlankCard onSelect={handleSelectBlank} />
                
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && searchQuery && (
                <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
                  No templates match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
