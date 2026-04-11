import type {Project, ProjectLink, ProjectMetric, TextValue} from '@/lib/types';

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
