import 'server-only';

import blogPostsJson from '@/data/blog-posts.json';
import chatKnowledgeJson from '@/data/chat-knowledge.json';
import discussionsJson from '@/data/discussions.json';
import profileJson from '@/data/profile.json';
import projectsJson from '@/data/projects.json';
import resumeJson from '@/data/resume.json';
import siteJson from '@/data/site.json';
import usersJson from '@/data/users.json';
import {applyProfileContactOverrides, applySiteContactOverrides} from '@/lib/contact';
import type {
  ApiListResponse,
  BlogPost,
  ChatKnowledge,
  Discussion,
  MockUser,
  Profile,
  Project,
  ResumeData,
  SiteData
} from '@/lib/types';
import {normalizeBlogPosts, normalizeDiscussions, normalizeProfile, normalizeProjects, normalizeResume} from '@/lib/normalizers';

const staticProfile = applyProfileContactOverrides(normalizeProfile(profileJson as unknown as Profile));
const staticSite = applySiteContactOverrides(siteJson as SiteData);
const staticProjects = normalizeProjects(projectsJson as unknown as Project[]);
const staticBlogPosts = normalizeBlogPosts(blogPostsJson as unknown as BlogPost[]);
const staticDiscussions = normalizeDiscussions(discussionsJson as unknown as Discussion[]);
const staticResume = normalizeResume(resumeJson as unknown as ResumeData);
const staticUsers = usersJson as MockUser[];
const staticChatKnowledge = chatKnowledgeJson as ChatKnowledge;

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim();
  return base ? base.replace(/\/+$/, '') : '';
}

function isLiveDataEnabled() {
  return Boolean(getApiBase());
}

async function fetchLiveJson<T>(path: string): Promise<T | null> {
  const apiBase = getApiBase();
  if (!apiBase) return null;

  try {
    const response = await fetch(`${apiBase}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function getProfile() {
  const live = await fetchLiveJson<Profile>('/api/profile');
  return applyProfileContactOverrides(normalizeProfile(live ?? staticProfile));
}

export async function getSite() {
  const live = await fetchLiveJson<SiteData>('/api/site');
  return applySiteContactOverrides(live ?? staticSite);
}

export async function getProjects() {
  const live = await fetchLiveJson<ApiListResponse<Project>>('/api/projects');
  return normalizeProjects(live?.items ?? staticProjects);
}

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getBlogPosts() {
  const live = await fetchLiveJson<ApiListResponse<BlogPost>>('/api/posts');
  return normalizeBlogPosts(live?.items ?? staticBlogPosts).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getFeaturedBlogPost() {
  const posts = await getBlogPosts();
  return posts.find((post) => post.featured) ?? posts[0] ?? null;
}

export async function getDiscussions() {
  const live = await fetchLiveJson<ApiListResponse<Discussion>>('/api/discussions');
  return normalizeDiscussions(live?.items ?? staticDiscussions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDiscussionBySlug(slug: string) {
  const discussions = await getDiscussions();
  return discussions.find((discussion) => discussion.slug === slug) ?? null;
}

export async function getResume() {
  const live = await fetchLiveJson<ResumeData>('/api/resume');
  return normalizeResume(live ?? staticResume);
}

export async function getUsers() {
  if (isLiveDataEnabled()) {
    return [] as MockUser[];
  }
  return staticUsers;
}

export async function getOnlineUsers() {
  const users = await getUsers();
  return users.filter((user) => user.status === 'online');
}

export async function getChatKnowledge() {
  return staticChatKnowledge;
}
