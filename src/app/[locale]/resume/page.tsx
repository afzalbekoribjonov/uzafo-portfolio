import {setRequestLocale} from 'next-intl/server';
import {ResumePageClient} from '@/components/pages/resume-page-client';
import {getProfile, getResume, getSite} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params; return buildPageMetadata('resume', locale); }
export default async function ResumePage({params}:{params:Promise<{locale: Locale}>;}) { const {locale}=await params; setRequestLocale(locale); const [profile, resume, site] = await Promise.all([getProfile(), getResume(), getSite()]); return <ResumePageClient initialProfile={profile} initialResume={resume} resumePdf={site.resumePdf} />; }
