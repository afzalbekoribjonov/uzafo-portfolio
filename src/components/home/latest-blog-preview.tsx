'use client';

import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {SectionHeading} from '@/components/ui/section-heading';
import {Link} from '@/i18n/navigation';
import {formatTimestamp, resolveLocaleText} from '@/lib/utils';
import type {BlogPost, Locale} from '@/lib/types';

interface LatestBlogPreviewProps {
  post: BlogPost;
}

export function LatestBlogPreview({post}: LatestBlogPreviewProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      <SectionHeading title={t('latestPost')} action={<ButtonLink href="/blog" variant="ghost">{t('viewAll')}</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <DynamicMedia src={post.cover} alt={resolveLocaleText(post.title, locale)} className="rounded-[28px] border border-white/10 bg-slate-900" placeholderTitle="Latest post has no cover" placeholderHint="The preview still works without a forced default image." />
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{formatTimestamp(post.publishedAt, locale)}</p>
          <h3 className="text-2xl font-semibold text-white">{resolveLocaleText(post.title, locale)}</h3>
          <p className="text-sm leading-7 text-slate-300">{resolveLocaleText(post.excerpt, locale)}</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{post.author.name}</span>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex cursor-pointer items-center rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {t('readMore')}
          </Link>
        </div>
      </div>
    </section>
  );
}
