'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, MonitorPlay, Edit3 } from 'lucide-react';
import { useHyperFramesStore } from '@/lib/hyperframes/store';
import { createComposition, saveComposition } from '@/lib/hyperframes/composition-manager';
import PlayerPreview from './player-preview';

interface AIGeneratorViewProps {
  onSendToManual: () => void;
  onRender: () => void;
}

export default function AIGeneratorView({ onSendToManual, onRender }: AIGeneratorViewProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { composition, setComposition, setEditorHtml, setEditorCss } = useHyperFramesStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    const currentPrompt = prompt;
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/hyperframes/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          // Only send currentHtml/Css if we already have an AI composition we are modifying
          currentHtml: messages.length > 0 ? composition.html : undefined,
          currentCss: messages.length > 0 ? composition.css : undefined
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate');

      const newComposition = createComposition({
        ...data.composition,
        tracks: [
          { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
        ],
        metadata: { author: 'AI', tags: ['ai-generated'], description: currentPrompt, templateId: null },
      });

      saveComposition(newComposition);
      setComposition(newComposition);
      setEditorHtml(newComposition.html);
      setEditorCss(newComposition.css);

      setMessages(prev => [...prev, { role: 'ai', content: 'Composition updated successfully!' }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-100px)] gap-2 p-2">
      {/* Left Panel: Chat Interface */}
      <div className="flex flex-col w-full lg:w-[400px] xl:w-[450px] glass-panel rounded-lg overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-purple-400">
            <Sparkles className="w-4 h-4" /> AI Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Describe the composition or ask for adjustments.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
             <div className="text-center text-zinc-500 text-sm mt-10">
               Start by describing the video composition you want.
             </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' 
                  : 'bg-white/5 text-zinc-300 border border-white/10'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-xl text-sm bg-white/5 text-zinc-300 border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                Generating...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="e.g. A neon cyberpunk title card with floating particles..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500 resize-none outline-none focus:border-purple-500/50 transition-colors h-14 min-h-[56px]"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Preview and Actions */}
      <div className="flex flex-col flex-1 gap-2 min-w-0">
        <div className="flex-1 relative glass-panel rounded-lg overflow-hidden flex flex-col">
           <PlayerPreview />
        </div>
        
        {/* Actions Toolbar */}
        <div className="glass-panel rounded-lg p-3 flex justify-end gap-2 shrink-0">
           <button
             onClick={onSendToManual}
             className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
           >
             <Edit3 className="w-4 h-4" />
             Open in Manual Editor
           </button>
           <button
             onClick={onRender}
             className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:opacity-90 transition-opacity"
           >
             <MonitorPlay className="w-4 h-4" />
             Render Video
           </button>
        </div>
      </div>
    </div>
  );
}
