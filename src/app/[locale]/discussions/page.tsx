import {setRequestLocale} from 'next-intl/server';
import {DiscussionsPageClient} from '@/components/pages/discussions-page-client';
import {getDiscussions} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return buildPageMetadata('discussions', locale);
}

export default async function DiscussionsPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <DiscussionsPageClient initialDiscussions={await getDiscussions()} />;
}
