import {setRequestLocale} from 'next-intl/server';
import {PortfolioPageClient} from '@/components/pages/portfolio-page-client';
import {getProjects} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params; return buildPageMetadata('portfolio', locale); }
export default async function PortfolioPage({params}:{params:Promise<{locale: Locale}>;}) { const {locale}=await params; setRequestLocale(locale); return <PortfolioPageClient initialProjects={await getProjects()} />; }
