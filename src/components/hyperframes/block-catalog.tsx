'use client'

import { useState, useMemo } from 'react'
import { Search, X, Plus, Eye, LayoutGrid, Film, BarChart3, Type, ArrowRightLeft, Layers, LayoutTemplate } from 'lucide-react'
import { BLOCKS, BLOCK_CATEGORIES } from '@/constants/hyperframes/blocks'
import { useHyperFramesStore } from '@/lib/hyperframes/store'
import type { Block, BlockCategory, Clip, DataAttributes } from '@/types/hyperframes'

const CATEGORY_ICONS: Record<BlockCategory, React.ReactNode> = {
  social: <LayoutGrid className="w-3.5 h-3.5" />,
  cinematic: <Film className="w-3.5 h-3.5" />,
  'data-viz': <BarChart3 className="w-3.5 h-3.5" />,
  text: <Type className="w-3.5 h-3.5" />,
  transition: <ArrowRightLeft className="w-3.5 h-3.5" />,
  overlay: <Layers className="w-3.5 h-3.5" />,
  template: <LayoutTemplate className="w-3.5 h-3.5" />,
}

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  social: 'Social',
  cinematic: 'Cinematic',
  'data-viz': 'Data Viz',
  text: 'Text',
  transition: 'Transition',
  overlay: 'Overlay',
  template: 'Template',
}

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  social: 'bg-pink-500/20 text-pink-300',
  cinematic: 'bg-amber-500/20 text-amber-300',
  'data-viz': 'bg-cyan-500/20 text-cyan-300',
  text: 'bg-yellow-500/20 text-yellow-300',
  transition: 'bg-blue-500/20 text-blue-300',
  overlay: 'bg-emerald-500/20 text-emerald-300',
  template: 'bg-purple-500/20 text-purple-300',
}

function parseDataAttributes(html: string): DataAttributes {
  const attrs: DataAttributes = {}
  const attrRegex = /\sdata-([\w-]+)="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = attrRegex.exec(html)) !== null) {
    const key = `data-${match[1]}`
    const value = match[2]
    const num = Number(value)
    attrs[key] = isNaN(num) ? value : num
  }
  return attrs
}

function insertBlock(block: Block) {
  const store = useHyperFramesStore.getState()
  const { composition, setEditorHtml, updateComposition } = store

  const dataAttrs = parseDataAttributes(block.html)
  const startTime = typeof dataAttrs['data-start'] === 'number' ? dataAttrs['data-start'] : 0
  const duration = typeof dataAttrs['data-duration'] === 'number' ? dataAttrs['data-duration'] : 3

  const trackIndex = typeof dataAttrs['data-track-index'] === 'number' ? dataAttrs['data-track-index'] : 0
  const targetTrack = composition.tracks[trackIndex]
    ?? composition.tracks.find((t) => t.type === 'video')
    ?? composition.tracks[0]

  if (!targetTrack) return

  const newClip: Clip = {
    id: `clip-${block.id}-${Date.now()}`,
    trackId: targetTrack.id,
    startTime,
    duration,
    type: 'html',
    content: block.html,
    dataAttributes: dataAttrs,
    transitions: {},
  }

  const updatedTracks = composition.tracks.map((track) =>
    track.id === targetTrack.id
      ? { ...track, clips: [...track.clips, newClip] }
      : track,
  )

  const updatedHtml = composition.html + '\n' + block.html
  const updatedCss = composition.css + '\n' + block.css

  updateComposition({
    tracks: updatedTracks,
    html: updatedHtml,
    css: updatedCss,
  })
  setEditorHtml(updatedHtml)
}

function PreviewModal({ block, onClose }: { block: Block; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-xl p-6 max-w-lg w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{block.name}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
          <div
            className="transform scale-[0.2] origin-center pointer-events-none"
            style={{ width: 1920, height: 1080 }}
            dangerouslySetInnerHTML={{ __html: block.html + `<style>${block.css}</style>` }}
          />
        </div>

        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[block.category]}`}>
            {CATEGORY_ICONS[block.category]}
            {CATEGORY_LABELS[block.category]}
          </span>
          <p className="text-sm text-zinc-400">{block.description}</p>
          <div className="flex flex-wrap gap-1">
            {block.tags.map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => { insertBlock(block); onClose() }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Insert Block
        </button>
      </div>
    </div>
  )
}

export default function BlockCatalog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all'>('all')
  const [previewBlock, setPreviewBlock] = useState<Block | null>(null)

  const filteredBlocks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return BLOCKS.filter((block) => {
      const matchesCategory = activeCategory === 'all' || block.category === activeCategory
      if (!matchesCategory) return false
      if (!query) return true
      return (
        block.name.toLowerCase().includes(query)
        || block.description.toLowerCase().includes(query)
        || block.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocks..."
          className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40'
              : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
          }`}
        >
          All
        </button>
        {BLOCK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
              activeCategory === cat
                ? `${CATEGORY_COLORS[cat]} ring-1 ring-current/30`
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
            }`}
          >
            {CATEGORY_ICONS[cat]}
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No blocks found</p>
            <p className="text-xs text-zinc-600 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                className="glass-panel rounded-lg overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => setPreviewBlock(block)}
                  className="relative aspect-video w-full bg-zinc-900/80 border-b border-white/5 flex items-center justify-center group cursor-pointer overflow-hidden"
                >
                  <div
                    className="transform scale-[0.18] origin-center pointer-events-none"
                    style={{ width: 1920, height: 1080 }}
                    dangerouslySetInnerHTML={{ __html: block.html + `<style>${block.css}</style>` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                {/* Info */}
                <div className="p-2 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-medium text-white leading-tight line-clamp-1">{block.name}</h4>
                    <span className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[block.category]}`}>
                      {CATEGORY_ICONS[block.category]}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 leading-tight">{block.description}</p>
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {block.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] px-1 py-px rounded bg-white/5 text-zinc-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => insertBlock(block)}
                    className="mt-1 flex items-center justify-center gap-1 w-full px-2 py-1 rounded text-[11px] font-medium bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Insert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewBlock && (
        <PreviewModal block={previewBlock} onClose={() => setPreviewBlock(null)} />
      )}
    </div>
  )
}
