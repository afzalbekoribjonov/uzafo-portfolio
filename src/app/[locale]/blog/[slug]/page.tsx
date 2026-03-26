import {setRequestLocale} from 'next-intl/server';
import {BlogDetailClient} from '@/components/pages/blog-detail-client';
import {getBlogPosts} from '@/lib/data';
import {buildPageMetadata} from '@/lib/metadata';
import type {Locale} from '@/lib/types';
import {resolveText} from '@/lib/utils';

export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const posts = await getBlogPosts();
  const post = posts.find((item) => item.slug === slug);

  return buildPageMetadata('blog', locale, {
    path: `/blog/${slug}`,
    title: post ? resolveText(post.title, locale) : undefined,
    description: post ? resolveText(post.excerpt, locale) : undefined,
    type: 'article'
  });
}

export default async function BlogPostPage({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  return <BlogDetailClient initialPosts={await getBlogPosts()} slug={slug} />;
}
