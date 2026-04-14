import type {Metadata} from 'next';
import type {Locale} from '@/lib/types';
import {getLocalizedPath, SITE_NAME, toOpenGraphLocale} from '@/lib/site-config';

const labels = {
  home: {uz: 'UZAFO | Afzalbek Oribjonov', en: 'UZAFO | Afzalbek Oribjonov'},
  about: {uz: 'Dasturchi haqida', en: 'About the Developer'},
  discussions: {uz: 'Muhokamalar', en: 'Discussions'},
  resume: {uz: 'Resume', en: 'Resume'},
  portfolio: {uz: 'Portfolio', en: 'Portfolio'},
  blog: {uz: 'Blog', en: 'Blog'},
  signIn: {uz: 'Kirish', en: 'Sign In'},
  signUp: {uz: 'Roʻyxatdan oʻtish', en: 'Sign Up'},
  admin: {uz: 'Admin boshqaruvi', en: 'Admin Controls'}
} as const;

const descriptions = {
  home: {
    uz: 'Afzalbek Oribjonovning portfolio sayti: loyihalar, blog yozuvlari, muhokamalar va resume bir joyda.',
    en: 'Afzalbek Oribjonov portfolio featuring projects, writing, discussions, and resume in one place.'
  },
  about: {
    uz: 'Texnologiyalar, tajriba va ish uslubi haqida qisqa va aniq maʼlumot.',
    en: 'A concise overview of technologies, experience, and working style.'
  },
  discussions: {
    uz: 'Savollar, javoblar va texnik muhokamalar uchun ochiq bo‘lim.',
    en: 'An open space for questions, replies, and technical discussions.'
  },
  resume: {
    uz: 'Tajriba, ko‘nikmalar, taʼlim va faoliyat yo‘nalishlari jamlangan sahifa.',
    en: 'A focused resume page covering experience, skills, education, and work direction.'
  },
  portfolio: {
    uz: 'Amaliy natija bergan loyihalar, case study va texnik yechimlar to‘plami.',
    en: 'A portfolio of practical projects, case studies, and technical solutions.'
  },
  blog: {
    uz: 'Dasturlash, tizimlar va amaliy tajribalar haqida yozuvlar.',
    en: 'Writing about programming, systems, and practical development work.'
  },
  signIn: {
    uz: 'Hisobingizga xavfsiz kirish va sayt bo‘ylab davom etish sahifasi.',
    en: 'Secure sign-in page for continuing across the site.'
  },
  signUp: {
    uz: 'Yangi hisob yaratish va muhokamalarda faol qatnashishni boshlash sahifasi.',
    en: 'Create a new account and start participating in discussions.'
  },
  admin: {
    uz: 'Kontent, blog va profil bo‘limlarini boshqarish paneli.',
    en: 'Control panel for managing content, blog, and profile sections.'
  }
} as const;

const paths = {
  home: '',
  about: '/about',
  discussions: '/discussions',
  resume: '/resume',
  portfolio: '/portfolio',
  blog: '/blog',
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  admin: '/admin'
} as const;

type MetadataPage = keyof typeof labels;

type BuildMetadataOptions = {
  path?: string;
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
};

export const NON_INDEXABLE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false
  }
} satisfies NonNullable<Metadata['robots']>;

function buildTitle(page: MetadataPage, locale: Locale, override?: string) {
  if (override) return `${override} | ${SITE_NAME}`;
  if (page === 'home') return labels.home[locale];
  return `${labels[page][locale]} | ${SITE_NAME}`;
}

export function buildPageMetadata(page: MetadataPage, locale: Locale, options: BuildMetadataOptions = {}): Metadata {
  const title = buildTitle(page, locale, options.title);
  const description = options.description?.trim() || descriptions[page][locale];
  const path = options.path ?? paths[page];
  const canonical = getLocalizedPath(locale, path);

  return {
    title,
    description,
    robots: options.robots,
    alternates: {
      canonical,
      languages: {
        uz: getLocalizedPath('uz', path),
        en: getLocalizedPath('en', path)
      }
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: toOpenGraphLocale(locale),
      type: options.type ?? 'website'
    },
    twitter: {
      card: 'summary',
      title,
      description
    }
  };
}
