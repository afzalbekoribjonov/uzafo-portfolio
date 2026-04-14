import {getAbsoluteUrl, getLocalizedUrl, SITE_NAME, SITE_OWNER, SITE_URL, toOpenGraphLocale} from '@/lib/site-config';
import type {Locale} from '@/lib/types';

const SECTION_LABELS = [
  {
    path: '/about',
    label: {
      uz: 'Dasturchi haqida',
      en: 'About the Developer'
    }
  },
  {
    path: '/portfolio',
    label: {
      uz: 'Portfolio',
      en: 'Portfolio'
    }
  },
  {
    path: '/blog',
    label: {
      uz: 'Blog',
      en: 'Blog'
    }
  },
  {
    path: '/discussions',
    label: {
      uz: 'Muhokama',
      en: 'Discussions'
    }
  },
  {
    path: '/resume',
    label: {
      uz: 'Resume',
      en: 'Resume'
    }
  }
] as const;

export function buildHomeStructuredData(locale: Locale) {
  const localeTag = toOpenGraphLocale(locale).replace('_', '-');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        name: SITE_NAME,
        alternateName: SITE_NAME.toLowerCase(),
        url: SITE_URL,
        inLanguage: localeTag,
        publisher: {
          '@id': `${SITE_URL}#organization`
        }
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME.toLowerCase(),
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: getAbsoluteUrl('/apple-touch-icon.png')
        },
        founder: {
          '@type': 'Person',
          name: SITE_OWNER
        }
      },
      ...SECTION_LABELS.map((section) => ({
        '@type': 'SiteNavigationElement',
        name: section.label[locale],
        url: getLocalizedUrl(locale, section.path),
        inLanguage: localeTag
      }))
    ]
  };
}
