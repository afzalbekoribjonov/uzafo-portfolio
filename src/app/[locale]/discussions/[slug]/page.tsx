import {setRequestLocale} from 'next-intl/server';
import {DiscussionDetailPageClient} from '@/components/pages/discussion-detail-page-client';
import {getDiscussions} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';
import {resolveText} from '@/lib/utils';

export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const discussions = await getDiscussions();
  const discussion = discussions.find((item) => item.slug === slug);

  return buildPageMetadata('discussions', locale, {
    path: `/discussions/${slug}`,
    title: discussion ? resolveText(discussion.title, locale) : undefined,
    description: discussion ? resolveText(discussion.summary, locale) : undefined,
    type: 'article'
  });
}

export default async function DiscussionDetailPage({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  return <DiscussionDetailPageClient initialDiscussions={await getDiscussions()} slug={slug} />;
}
