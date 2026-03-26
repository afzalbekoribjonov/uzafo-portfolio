import type {ReactNode} from 'react';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {FloatingAiAssistant} from '@/components/chat/floating-ai-assistant';
import {SiteFooter} from '@/components/layout/site-footer';
import {SiteHeader} from '@/components/layout/site-header';
import {routing} from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: {children: ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="relative flex min-h-screen flex-col" style={{background: 'var(--page-bg)'}}>
        {/* Ambient decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 20% 0%, rgba(34,211,238,0.07) 0%,transparent 35%),' +
              'radial-gradient(circle at 80% 100%, rgba(168,85,247,0.06) 0%,transparent 35%)'
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <FloatingAiAssistant />
      </div>
    </NextIntlClientProvider>
  );
}
