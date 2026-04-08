import {setRequestLocale} from 'next-intl/server';
import {AboutPageClient} from '@/components/pages/about-page-client';
import {getProfile} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';


export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params; return buildPageMetadata('about', locale); }
export default async function AboutPage({params}:{params:Promise<{locale: Locale}>;}) { const {locale}=await params; setRequestLocale(locale); return <AboutPageClient initialProfile={await getProfile()} />; }
