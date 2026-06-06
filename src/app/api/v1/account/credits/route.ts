import { withApi } from '@/lib/api/with-api';
import { badRequest } from '@/lib/api/envelope';
import { getKieCredits } from '@/lib/kie';
import { getGptImageCredits } from '@/lib/gpt-image';
import { getBalance } from '@/lib/heygen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreditInfo {
  provider: string;
  balance: number | null;
  currency: string | null;
}

async function kieCredits(): Promise<CreditInfo> {
  const r = (await getKieCredits()) as { data?: unknown };
  return { provider: 'kie', balance: typeof r.data === 'number' ? r.data : null, currency: 'credits' };
}

async function gptImageCredits(): Promise<CreditInfo> {
  const r = await getGptImageCredits();
  return {
    provider: 'gpt-image',
    balance: typeof r.data === 'number' ? r.data : null,
    currency: 'credits',
  };
}

async function heygenCredits(): Promise<CreditInfo> {
  const d = await getBalance();
  return {
    provider: 'heygen',
    balance: d.wallet?.remaining_balance ?? d.subscription?.remaining ?? null,
    currency: d.wallet?.currency ?? null,
  };
}

const PROVIDERS: Record<string, () => Promise<CreditInfo>> = {
  kie: kieCredits,
  'gpt-image': gptImageCredits,
  heygen: heygenCredits,
};

export const GET = withApi(
  async (_req, ctx) => {
    const provider = ctx.searchParams.get('provider');

    if (provider) {
      const fn = PROVIDERS[provider];
      if (!fn) {
        throw badRequest(`Unknown provider "${provider}". Allowed: ${Object.keys(PROVIDERS).join(', ')}`);
      }
      return { data: [await fn()] };
    }

    const entries = Object.entries(PROVIDERS);
    const settled = await Promise.allSettled(entries.map(([, fn]) => fn()));
    const data = settled.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        provider: entries[i][0],
        balance: null,
        currency: null,
        error: result.reason instanceof Error ? result.reason.message : 'unavailable',
      };
    });
    return { data };
  },
  { scope: 'read' },
);
