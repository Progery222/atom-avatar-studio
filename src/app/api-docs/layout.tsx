import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API — Atom Avatar Studio',
  description:
    'Документация внешнего REST API Atom Avatar Studio: аутентификация, эндпоинты, примеры и проверка подключения.',
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
