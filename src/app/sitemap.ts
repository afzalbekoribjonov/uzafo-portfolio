import type {MetadataRoute} from 'next';
import {getBlogPosts, getDiscussions, getProjects} from '@/lib/data';
import {getLocalizedUrl} from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['uz', 'en'] as const;
  const staticPaths = ['', '/about', '/discussions', '/resume', '/portfolio', '/blog', '/auth/sign-in', '/auth/sign-up', '/admin'];
  const [posts, discussions, projects] = await Promise.all([
    getBlogPosts(),
    getDiscussions(),
    getProjects(),
  ]);

  const staticEntries = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: getLocalizedUrl(locale, path),
      lastModified: new Date()
    }))
  );

  const blogEntries = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: getLocalizedUrl(locale, `/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt)
    }))
  );

  const discussionEntries = locales.flatMap((locale) =>
    discussions.map((discussion) => ({
      url: getLocalizedUrl(locale, `/discussions/${discussion.slug}`),
      lastModified: new Date(discussion.createdAt)
    }))
  );

  const portfolioEntries = locales.flatMap((locale) =>
    projects.map((project) => ({
      url: getLocalizedUrl(locale, `/portfolio/${project.slug}`),
      lastModified: new Date()
    }))
  );

  return [...staticEntries, ...blogEntries, ...discussionEntries, ...portfolioEntries];
}
