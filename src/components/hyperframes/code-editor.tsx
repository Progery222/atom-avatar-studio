'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Extension, Prec } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { undo } from '@codemirror/commands';
import { useHyperFramesStore } from '@/lib/hyperframes/store';
import { saveComposition } from '@/lib/hyperframes/composition-manager';

type EditorMode = 'html' | 'css';

const DEBOUNCE_MS = 300;

function getLanguageExtension(mode: EditorMode): Extension {
  return mode === 'html' ? html() : css();
}

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<EditorMode>('html');

  const [mode, setMode] = useState<EditorMode>('html');
  const [readOnly, setReadOnly] = useState(false);

  const editorHtml = useHyperFramesStore((s) => s.editorHtml);
  const editorCss = useHyperFramesStore((s) => s.editorCss);
  const setEditorHtml = useHyperFramesStore((s) => s.setEditorHtml);
  const setEditorCss = useHyperFramesStore((s) => s.setEditorCss);
  const composition = useHyperFramesStore((s) => s.composition);
  const setIsDirty = useHyperFramesStore((s) => s.setIsDirty);

  modeRef.current = mode;

  const handleSave = useCallback(() => {
    saveComposition(composition);
    setIsDirty(false);
  }, [composition, setIsDirty]);

  const syncToStore = useCallback(
    (value: string, currentMode: EditorMode) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (currentMode === 'html') {
          setEditorHtml(value);
        } else {
          setEditorCss(value);
        }
      }, DEBOUNCE_MS);
    },
    [setEditorHtml, setEditorCss],
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const onChange = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        syncToStore(update.state.doc.toString(), modeRef.current);
      }
    });

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          handleSave();
          return true;
        },
      },
      {
        key: 'Mod-z',
        run: (v) => {
          undo(v);
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: editorHtml,
      extensions: [
        basicSetup,
        getLanguageExtension('html'),
        oneDark,
        onChange,
        Prec.high(saveKeymap),
        EditorView.editable.of(!readOnly),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          },
          '.cm-content': {
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          },
          '.cm-gutters': {
            backgroundColor: '#09090b',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = mode === 'html' ? editorHtml : editorCss;
    const storedContent = view.state.doc.toString();

    if (currentContent !== storedContent) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: currentContent },
      });
    }
  }, [mode, editorHtml, editorCss]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const newExtensions: Extension[] = [
      basicSetup,
      getLanguageExtension(mode),
      oneDark,
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.docChanged) {
          syncToStore(update.state.doc.toString(), modeRef.current);
        }
      }),
      Prec.high(
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              handleSave();
              return true;
            },
          },
          {
            key: 'Mod-z',
            run: (v) => {
              undo(v);
              return true;
            },
          },
        ]),
      ),
      EditorView.editable.of(!readOnly),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '13px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        '.cm-content': {
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        },
        '.cm-gutters': {
          backgroundColor: '#09090b',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        },
      }),
    ];

    view.setState(EditorState.create({ doc: view.state.doc, extensions: newExtensions }));
  }, [mode, readOnly, handleSave, syncToStore]);

  return (
    <div className="flex flex-col h-full glass-panel rounded-lg overflow-hidden">
      <div className="hf-toolbar border-b border-white/5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('html')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'html'
                ? 'bg-[#8b5cf6] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setMode('css')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'css'
                ? 'bg-[#8b5cf6] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            CSS
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setReadOnly(!readOnly)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              readOnly
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title={readOnly ? 'Read-only ON' : 'Read-only OFF'}
          >
            {readOnly ? '🔒 RO' : '🔓 Edit'}
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs rounded bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 border border-[#8b5cf6]/30 transition-colors"
            title="Save (Cmd+S)"
          >
            💾 Save
          </button>
        </div>
      </div>

      <div ref={editorRef} className="flex-1 overflow-hidden max-w-full" />
    </div>
  );
}
