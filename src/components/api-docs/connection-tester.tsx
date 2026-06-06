'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, PlugZap } from 'lucide-react';

interface VerifyResult {
  ok: boolean;
  status: number;
  keyId?: string;
  scopes?: string[];
  expiresAt?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

export function ConnectionTester() {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const test = async () => {
    setLoading(true);
    setResult(null);
    const root = baseUrl.replace(/\/+$/, '');
    try {
      const res = await fetch(`${root}/api/v1/auth/verify`, {
        headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setResult({
          ok: true,
          status: res.status,
          keyId: json.data?.key_id,
          scopes: json.data?.scopes,
          expiresAt: json.data?.expires_at ?? null,
        });
      } else {
        setResult({
          ok: false,
          status: res.status,
          errorCode: json?.error?.code ?? 'error',
          errorMessage: json?.error?.message ?? `HTTP ${res.status}`,
        });
      }
    } catch (e) {
      setResult({
        ok: false,
        status: 0,
        errorCode: 'network_error',
        errorMessage: e instanceof Error ? e.message : 'Не удалось выполнить запрос',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PlugZap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-white">Проверка подключения</h3>
      </div>
      <p className="text-sm text-white/50">
        Вставьте Base URL и API-ключ — запрос уйдёт на <code className="font-mono text-white/70">GET /api/v1/auth/verify</code> и
        покажет, валиден ли ключ и какие у него права.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Base URL</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-service.example.com"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">API-ключ (X-API-Key)</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="atom_live_…"
            type="password"
            autoComplete="off"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <button
        onClick={test}
        disabled={loading || !apiKey || !baseUrl}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium transition-all active:scale-[0.99]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
        {loading ? 'Проверяем…' : 'Проверить подключение'}
      </button>

      {result && (
        <div
          className={`rounded-xl p-4 border text-sm ${
            result.ok
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          {result.ok ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Подключение успешно (HTTP {result.status})
              </div>
              <div className="text-white/70 font-mono text-xs space-y-0.5">
                <div>key_id: {result.keyId}</div>
                <div>scopes: [{result.scopes?.join(', ')}]</div>
                <div>expires_at: {result.expiresAt ?? 'never'}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-300 font-medium">
                <XCircle className="w-4 h-4" /> Ошибка (HTTP {result.status || '—'})
              </div>
              <div className="text-white/70 font-mono text-xs">
                {result.errorCode}: {result.errorMessage}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
