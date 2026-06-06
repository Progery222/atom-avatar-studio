'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

export interface EndpointDef {
  method: HttpMethod;
  path: string;
  scope: 'public' | 'read' | 'write' | 'admin';
  summary: string;
  request?: string;
  response?: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  POST: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  DELETE: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  PATCH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const SCOPE_LABELS: Record<EndpointDef['scope'], string> = {
  public: 'без ключа',
  read: 'scope: read',
  write: 'scope: write',
  admin: 'scope: admin',
};

export function EndpointCard({ endpoint }: { endpoint: EndpointDef }) {
  const [open, setOpen] = useState(false);
  const hasExample = Boolean(endpoint.request || endpoint.response);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <button
        onClick={() => hasExample && setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          hasExample ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default',
        )}
      >
        <span
          className={cn(
            'shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border',
            METHOD_COLORS[endpoint.method],
          )}
        >
          {endpoint.method}
        </span>
        <code className="text-sm text-white/90 font-mono break-all">{endpoint.path}</code>
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-white/30 hidden sm:inline">
          {SCOPE_LABELS[endpoint.scope]}
        </span>
        {hasExample && (
          <ChevronDown
            className={cn('w-4 h-4 text-white/30 transition-transform shrink-0', open && 'rotate-180')}
          />
        )}
      </button>

      <div className="px-4 pb-3 -mt-1">
        <p className="text-sm text-white/50">{endpoint.summary}</p>
      </div>

      <AnimatePresence initial={false}>
        {open && hasExample && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {endpoint.request && <CodeBlock code={endpoint.request} label="Запрос" />}
              {endpoint.response && <CodeBlock code={endpoint.response} label="Ответ" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
