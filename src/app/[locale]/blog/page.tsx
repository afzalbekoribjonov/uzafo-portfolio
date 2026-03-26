import {setRequestLocale} from 'next-intl/server';
import {BlogPageClient} from '@/components/pages/blog-page-client';
import {getBlogPosts, getProfile} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) {
  const {locale}=await params;
  return buildPageMetadata('blog', locale);
}

export default async function BlogPage({params}:{params:Promise<{locale: Locale}>;}) {
  const {locale}=await params;
  setRequestLocale(locale);
  const [posts, profile] = await Promise.all([getBlogPosts(), getProfile()]);
  return <BlogPageClient initialPosts={posts} initialProfile={profile} />;
}
