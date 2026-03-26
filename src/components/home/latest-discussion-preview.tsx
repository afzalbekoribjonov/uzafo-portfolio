'use client';

import {MessageSquareMore} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {SectionHeading} from '@/components/ui/section-heading';
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

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      <SectionHeading title={t('latestDiscussion')} action={<ButtonLink href="/discussions" variant="ghost">{t('viewAll')}</ButtonLink>} />
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {resolveLocaleText(discussion.category, locale)}
            </p>
            <h3 className="text-xl font-semibold text-white">{resolveLocaleText(discussion.title, locale)}</h3>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">{resolveLocaleText(discussion.summary, locale)}</p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 md:block">
            <MessageSquareMore className="h-7 w-7 text-cyan-300" />
          </div>
        </div>

        {latestMessage ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                {initials(latestMessage.author.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{latestMessage.author.name}</p>
                <p className="text-xs text-slate-400">{formatDateTime(latestMessage.createdAt, locale)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{stripHtml(resolveLocaleText(latestMessage.text, locale))}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            href={`/discussions/${discussion.slug}`}
            className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            {t('openDiscussion')}
          </Link>
        </div>
      </div>
    </section>
  );
}
