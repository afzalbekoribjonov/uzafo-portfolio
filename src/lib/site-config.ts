import type {Locale} from '@/lib/types';

export const SITE_NAME = 'UZAFO';
export const SITE_OWNER = 'Afzalbek Oribjonov';
export const DEFAULT_SITE_URL = 'https://uzafo.site';
export const DEFAULT_META_DESCRIPTION = 'Afzalbek Oribjonov portfolio: projects, writing, discussions, and resume.';

function normalizeSiteUrl(value?: string) {
  const candidate = value?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(candidate);
    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    return `${url.origin}${pathname}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function normalizePath(path = '') {
  if (!path || path === '/') return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function getAbsoluteUrl(path = '') {
  return new URL(normalizePath(path), `${SITE_URL}/`).toString();
}

export function getLocalizedPath(locale: Locale, path = '') {
  const normalized = normalizePath(path);
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function getLocalizedUrl(locale: Locale, path = '') {
  return getAbsoluteUrl(getLocalizedPath(locale, path));
}

export function toOpenGraphLocale(locale: Locale) {
  return locale === 'uz' ? 'uz_UZ' : 'en_US';
}
