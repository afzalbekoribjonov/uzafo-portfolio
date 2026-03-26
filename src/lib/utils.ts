import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';
import type {ContentBlock, Locale, LocalizedString, Project, TextValue} from '@/lib/types';
import {normalizeTextValue} from '@/lib/normalizers';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveLocaleText(value: TextValue | null | undefined, locale: Locale) {
  const normalized = normalizeTextValue(value, '');
  if (typeof normalized === 'string') return normalized;
  return normalized[locale] ?? normalized.en ?? normalized.uz ?? '';
}

export const resolveText = resolveLocaleText;

const TASHKENT_TIME_ZONE = 'Asia/Tashkent';
const MONTHS: Record<Locale, string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

function getTashkentDateParts(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TASHKENT_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(parsed);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const monthIndex = Number(values.month) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;

  return {
    year: values.year,
    monthIndex,
    day: values.day,
    hours: values.hour,
    minutes: values.minute
  };
}

export function formatDate(date: string, locale: Locale) {
  const parts = getTashkentDateParts(date);
  if (!parts) return date;

  const month = MONTHS[locale][parts.monthIndex] ?? MONTHS[locale][0];
  return locale === 'uz'
    ? `${parts.day} ${month} ${parts.year}`
    : `${month} ${parts.day}, ${parts.year}`;
}

export function formatDateTime(date: string, locale: Locale) {
  const parts = getTashkentDateParts(date);
  if (!parts) return date;

  const month = MONTHS[locale][parts.monthIndex] ?? MONTHS[locale][0];
  return locale === 'uz'
    ? `${parts.day} ${month} ${parts.year}, ${parts.hours}:${parts.minutes}`
    : `${month} ${parts.day}, ${parts.year}, ${parts.hours}:${parts.minutes}`;
}

export function formatTimestamp(date: string, locale: Locale) {
  return /T\d{2}:\d{2}/.test(date) ? formatDateTime(date, locale) : formatDate(date, locale);
}

export function pickStableProject(projects: Project[]) {
  if (projects.length === 0) return null;
  const seed = projects
    .map((project) => project.slug)
    .join('|')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % projects.length;
  return projects[index];
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const UZBEK_O_PATTERN = /o['`´ʻʼ‘’]/g;
const UZBEK_G_PATTERN = /g['`´ʻʼ‘’]/g;
const UZBEK_APOSTROPHE_PATTERN = /['`´ʻʼ‘’]/g;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(UZBEK_O_PATTERN, 'o')
    .replace(UZBEK_G_PATTERN, 'g')
    .replace(UZBEK_APOSTROPHE_PATTERN, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function ensureLocalized(value: string): LocalizedString {
  return {uz: value, en: value};
}

export function makeId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function estimateReadingTimeFromBlocks(blocks: ContentBlock[]) {
  const text = blocks
    .map((block) => {
      if (block.type === 'image' || block.type === 'video') return '';
      return typeof block.content === 'string' ? block.content : block.content.uz || block.content.en || '';
    })
    .join(' ');
  const wordCount = stripHtml(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

export function extractPlainTextFromBlocks(blocks: ContentBlock[]) {
  const block = blocks.find((item) => item.type !== 'image' && item.type !== 'video');
  if (!block) return '';
  const raw = typeof block.content === 'string' ? block.content : block.content.uz || block.content.en || '';
  return stripHtml(raw);
}

export function normalizeProject(project: Project): Project {
  const content = project.content && project.content.length > 0
    ? project.content
    : [{id: 'project-intro', type: 'richText' as const, content: typeof project.description === 'string' ? `<p>${project.description}</p>` : `<p>${project.description.en ?? project.description.uz}</p>`}];

  return {
    ...project,
    links: project.links ?? [
      {id: 'demo', label: 'Live Demo', href: '#'},
      {id: 'code', label: 'Source', href: '#'}
    ],
    content
  };
}
