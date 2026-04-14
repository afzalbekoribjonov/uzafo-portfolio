import type {MetadataRoute} from 'next';
import {SITE_URL, getAbsoluteUrl} from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/admin', '/uz/auth/', '/en/auth/', '/uz/admin', '/en/admin']
    },
    host: SITE_URL,
    sitemap: getAbsoluteUrl('/sitemap.xml')
  };
}
