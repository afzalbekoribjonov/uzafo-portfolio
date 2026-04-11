'use client';

import {MessageSquareMore, MessagesSquare} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {Link} from '@/i18n/navigation';
import {formatDateTime, initials, resolveLocaleText, stripHtml} from '@/lib/utils';
import type {Discussion, Locale} from '@/lib/types';

interface LatestDiscussionPreviewProps {
  discussion: Discussion;
}

export function LatestDiscussionPreview({discussion}: LatestDiscussionPreviewProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const latestMessage = discussion.messages.at(-1);
  const discussionPreview = stripHtml(resolveLocaleText(discussion.content, locale));

  return (
    <section
      className="overflow-hidden rounded-[36px] border"
      style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
    >
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b p-6 sm:p-8 lg:border-r lg:border-b-0" style={{borderColor: 'var(--border-1)'}}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--accent)'}}>
              <MessagesSquare className="h-4 w-4" />
              {t('latestDiscussion')}
            </div>
            <ButtonLink href="/discussions" variant="ghost">
              {t('viewAll')}
            </ButtonLink>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
            {resolveLocaleText(discussion.category, locale)}
          </p>
          <h3 className="mt-3 text-2xl font-semibold sm:text-[2rem]" style={{color: 'var(--text-1)'}}>
            {resolveLocaleText(discussion.title, locale)}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{color: 'var(--text-3)'}}>
            {resolveLocaleText(discussion.summary, locale)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm" style={{color: 'var(--text-3)'}}>
            <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}>
              <MessageSquareMore className="h-4 w-4" style={{color: 'var(--accent)'}} />
              {discussion.messages.length} {t('messages')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}>
              {discussion.author.name}
            </span>
          </div>

          <div className="mt-8">
            <Link
              href={`/discussions/${discussion.slug}`}
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
            >
              {t('openDiscussion')}
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div
            className="rounded-[28px] border p-5 sm:p-6"
            style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
          >
            {latestMessage ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold" style={{background: 'var(--accent-m)', color: 'var(--accent)'}}>
                    {initials(latestMessage.author.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{color: 'var(--text-1)'}}>
                      {latestMessage.author.name}
                    </p>
                    <p className="text-xs" style={{color: 'var(--text-4)'}}>
                      {formatDateTime(latestMessage.createdAt, locale)}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 sm:text-base" style={{color: 'var(--text-2)'}}>
                  {stripHtml(resolveLocaleText(latestMessage.text, locale))}
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{color: 'var(--text-1)'}}>
                  {resolveLocaleText(discussion.title, locale)}
                </p>
                <p className="line-clamp-6 text-sm leading-7" style={{color: 'var(--text-3)'}}>
                  {discussionPreview}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
