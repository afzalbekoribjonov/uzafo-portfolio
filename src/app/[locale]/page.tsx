import {getTranslations, setRequestLocale} from 'next-intl/server';
import {HomePageClient} from '@/components/pages/home-page-client';
import {getBlogPosts, getDiscussions, getProfile, getProjects} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params; return buildPageMetadata('home', locale); }

export default async function HomePage({params}:{params:Promise<{locale: Locale}>;}) {
  const {locale} = await params;
  setRequestLocale(locale);
  await getTranslations('home');
  const [profile, projects, blogPosts, discussions] = await Promise.all([
    getProfile(),
    getProjects(),
    getBlogPosts(),
    getDiscussions(),
  ]);
  return <HomePageClient initialProfile={profile} initialProjects={projects} initialBlogPosts={blogPosts} initialDiscussions={discussions} />;
}
