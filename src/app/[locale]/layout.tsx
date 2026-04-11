import type {ReactNode} from 'react';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {BackendConnectingScreen} from '@/components/system/backend-connecting-screen';
import type {BlogPost, Discussion} from '@/lib/types';
import {SiteFooter} from '@/components/layout/site-footer';
import {SiteHeader} from '@/components/layout/site-header';
import {routing} from '@/i18n/routing';
import {
  BackendUnavailableError,
  getBlogPosts,
  getDiscussions,
  getProfile,
  getProjects,
  getResume,
  getSite,
  probeBackendHealth
} from '@/lib/data';

function buildHeaderActivity(blogPosts: BlogPost[], discussions: Discussion[]) {
  return {
    commentAuthors: blogPosts.flatMap((post) => post.comments.map((comment) => comment.author)),
    discussionParticipants: discussions.map((discussion) => {
      const participants = new Set<string>();
      if (discussion.author.name.trim()) participants.add(discussion.author.name);
      discussion.messages.forEach((message) => {
        if (message.author.name.trim()) participants.add(message.author.name);
      });
      return [...participants];
    })
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export const dynamic = 'force-dynamic';

export default async function LocaleLayout({children, params}: {children: ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  let isBackendReady = true;
  let headerActivity = {commentAuthors: [] as string[], discussionParticipants: [] as string[][]};

  try {
    await probeBackendHealth();
    const [, , , blogPosts, discussions] = await Promise.all([
      getSite(),
      getProfile(),
      getProjects(),
      getBlogPosts(),
      getDiscussions(),
      getResume()
    ]);
    headerActivity = buildHeaderActivity(blogPosts, discussions);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      isBackendReady = false;
    } else {
      throw error;
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {!isBackendReady ? (
        <BackendConnectingScreen />
      ) : (
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
            <SiteHeader accountActivity={headerActivity} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </div>
      )}
    </NextIntlClientProvider>
  );
}
