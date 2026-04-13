import type {Locale, Project, ProjectLink, ProjectMetric, TextValue} from '@/lib/types';
import {resolveText, stripHtml} from '@/lib/utils';

const NON_PUBLIC_STATUSES = new Set(['draft', 'qoralama']);

function getTextEntries(value: TextValue | null | undefined) {
  if (!value) return [];
  return typeof value === 'string' ? [value] : Object.values(value);
}

export function hasPortfolioText(value: TextValue | null | undefined) {
  return getTextEntries(value).some((entry) => entry.trim().length > 0);
}

export function isPublicPortfolioProject(project: Project) {
  return !getTextEntries(project.status).some((entry) => NON_PUBLIC_STATUSES.has(entry.trim().toLowerCase()));
}

export function isUsablePortfolioTag(tag: string) {
  return tag.trim().length > 0;
}

export function isUsablePortfolioMetric(metric: ProjectMetric) {
  return hasPortfolioText(metric.label) && metric.value.trim().length > 0;
}

export function isUsablePortfolioLink(link: ProjectLink) {
  const label = link.label.trim();
  const href = link.href.trim();
  return label.length > 0 && href.length > 0 && href !== '#';
}

export function normalizePortfolioHref(href: string) {
  const value = href.trim();
  if (!value || value === '#') return '#';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  if (/^[a-z][a-z\d+\-.]*:/i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `https://${value.replace(/^\/+/, '')}`;
}

export function getPortfolioLinkCaption(href: string) {
  const value = href.trim();
  if (!value) return '';

  try {
    const normalized = normalizePortfolioHref(value);
    return new URL(normalized).hostname.replace(/^www\./i, '');
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  }
}

export function hasStandalonePortfolioContent(project: Project, locale: Locale) {
  const blocks = project.content ?? [];
  if (blocks.length === 0) return false;

  const description = stripHtml(resolveText(project.description, locale));
  if (!description) return true;
  if (blocks.length !== 1) return true;

  const [block] = blocks;
  if (block.type === 'image' || block.type === 'video') return true;

  return stripHtml(resolveText(block.content, locale)) !== description;
}
