import 'server-only';

import {cache} from 'react';
import {applyProfileContactOverrides, applySiteContactOverrides} from '@/lib/contact';
import type {
  ApiListResponse,
  BlogPost,
  Discussion,
  MockUser,
  Profile,
  Project,
  ResumeData,
  SiteData
} from '@/lib/types';
import {normalizeBlogPosts, normalizeDiscussions, normalizeProfile, normalizeProjects, normalizeResume} from '@/lib/normalizers';

export class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (!base) {
    throw new BackendUnavailableError('NEXT_PUBLIC_API_BASE is not configured.');
  }
  return base.replace(/\/+$/, '');
}

async function parseJsonResponse<T>(response: Response, path: string): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text().catch(() => '')).slice(0, 160);
    throw new BackendUnavailableError(
      `Expected JSON from ${path}, received "${contentType || 'unknown'}"${preview ? `: ${preview}` : '.'}`
    );
  }

  try {
    return await response.json() as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON response.';
    throw new BackendUnavailableError(`Failed to parse ${path}: ${message}`);
  }
}

async function fetchLiveJson<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = getApiBase();
  let response: Response;

  try {
    response = await fetch(`${apiBase}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {})
      },
      ...init
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error.';
    throw new BackendUnavailableError(`Failed to reach backend for ${path}: ${message}`);
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 160);
    throw new BackendUnavailableError(
      `Backend request failed for ${path}: HTTP ${response.status}${detail ? ` ${detail}` : ''}`
    );
  }

  return parseJsonResponse<T>(response, path);
}

export const probeBackendHealth = cache(async () => {
  const apiBase = getApiBase();

  try {
    const headResponse = await fetch(`${apiBase}/health`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    if (headResponse.ok) {
      return true;
    }
  } catch {
    // Fall through to GET probe below.
  }

  try {
    const response = await fetch(`${apiBase}/health`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });
    if (!response.ok) {
      throw new BackendUnavailableError(`Backend health probe returned HTTP ${response.status}.`);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health probe failed.';
    throw new BackendUnavailableError(message);
  }
});

export const getProfile = cache(async () => {
  const live = await fetchLiveJson<Profile>('/api/profile');
  return applyProfileContactOverrides(normalizeProfile(live));
});

export const getSite = cache(async () => {
  const live = await fetchLiveJson<SiteData>('/api/site');
  return applySiteContactOverrides(live);
});

export const getProjects = cache(async () => {
  const live = await fetchLiveJson<ApiListResponse<Project>>('/api/projects');
  return normalizeProjects(live.items);
});

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export const getBlogPosts = cache(async () => {
  const live = await fetchLiveJson<ApiListResponse<BlogPost>>('/api/posts');
  return normalizeBlogPosts(live.items).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
});

export async function getBlogPostBySlug(slug: string) {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getFeaturedBlogPost() {
  const posts = await getBlogPosts();
  return posts.find((post) => post.featured) ?? posts[0] ?? null;
}

export const getDiscussions = cache(async () => {
  const live = await fetchLiveJson<ApiListResponse<Discussion>>('/api/discussions');
  return normalizeDiscussions(live.items).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

export async function getDiscussionBySlug(slug: string) {
  const discussions = await getDiscussions();
  return discussions.find((discussion) => discussion.slug === slug) ?? null;
}

export const getResume = cache(async () => {
  const live = await fetchLiveJson<ResumeData>('/api/resume');
  return normalizeResume(live);
});

export const getUsers = cache(async () => [] as MockUser[]);
