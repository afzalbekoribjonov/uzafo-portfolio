import {setRequestLocale} from 'next-intl/server';
import {PortfolioDetailClient} from '@/components/pages/portfolio-detail-client';
import {getProjects} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';
import {resolveText} from '@/lib/utils';

export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const projects = await getProjects();
  const project = projects.find((item) => item.slug === slug);

  return buildPageMetadata('portfolio', locale, {
    path: `/portfolio/${slug}`,
    title: project ? resolveText(project.title, locale) : undefined,
    description: project ? resolveText(project.excerpt, locale) : undefined
  });
}

export default async function PortfolioDetailPage({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  return <PortfolioDetailClient initialProjects={await getProjects()} slug={slug} />;
}
