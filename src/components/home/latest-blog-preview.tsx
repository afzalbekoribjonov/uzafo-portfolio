'use client';

import {Clock3, PencilLine} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {Link} from '@/i18n/navigation';
import {formatTimestamp, resolveLocaleText} from '@/lib/utils';
import type {BlogPost, Locale} from '@/lib/types';

interface LatestBlogPreviewProps {
  post: BlogPost;
}

export function LatestBlogPreview({post}: LatestBlogPreviewProps) {
  const t = useTranslations('common');
  const home = useTranslations('home');
  const locale = useLocale() as Locale;

  return (
    <section
      className="overflow-hidden rounded-[36px] border"
      style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
    >
      <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
        <div className="order-2 flex flex-col justify-between p-6 sm:p-8 lg:order-1">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                  {t('latestPost')}
                </p>
                <p className="mt-2 text-sm" style={{color: 'var(--text-4)'}}>
                  {formatTimestamp(post.publishedAt, locale)}
                </p>
              </div>
              <ButtonLink href="/blog" variant="ghost">
                {t('viewAll')}
              </ButtonLink>
            </div>

            <h3 className="max-w-2xl text-2xl font-semibold sm:text-[2rem]" style={{color: 'var(--text-1)'}}>
              {resolveLocaleText(post.title, locale)}
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{color: 'var(--text-3)'}}>
              {resolveLocaleText(post.excerpt, locale)}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3 text-sm" style={{color: 'var(--text-3)'}}>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2"
                style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
              >
                <PencilLine className="h-4 w-4" style={{color: 'var(--accent)'}} />
                {post.author.name}
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2"
                style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
              >
                <Clock3 className="h-4 w-4" style={{color: 'var(--accent)'}} />
                {post.readingTime} min
              </span>
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
            >
              {t('readMore')}
            </Link>
          </div>
        </div>

        <div className="order-1 min-h-[260px] border-b lg:order-2 lg:min-h-[360px] lg:border-b-0 lg:border-l" style={{borderColor: 'var(--border-1)'}}>
          <DynamicMedia
            src={post.cover}
            alt={resolveLocaleText(post.title, locale)}
            className="h-full"
            mediaClassName="h-full w-full object-cover"
            placeholderTitle={home('placeholders.blogTitle')}
            placeholderHint={home('placeholders.blogHint')}
          />
        </div>
      </div>
    </section>
  );
}
