import type {Profile, SiteData} from '@/lib/types';

export const CONTACT_PHONE = '+998 94 108 09 16';

export const CONTACT_SOCIALS: Array<{name: string; href: string}> = [
  {name: 'GitHub', href: 'https://github.com/afzalbekoribjonov'},
  {name: 'LinkedIn', href: 'https://www.linkedin.com/in/afzalbekoribjonov'},
  {name: 'Telegram', href: 'https://t.me/uzafo'},
  {name: 'Phone', href: 'tel:+998941080916'}
];

export function formatPhoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized.startsWith('+') ? `tel:${normalized}` : `tel:+${normalized}`;
}

export function applyProfileContactOverrides(profile: Profile): Profile {
  return {
    ...profile,
    phone: profile.phone.trim() || CONTACT_PHONE
  };
}

export function applySiteContactOverrides(site: SiteData): SiteData {
  return {
    ...site,
    socials: CONTACT_SOCIALS.map((item) => ({...item}))
  };
}
