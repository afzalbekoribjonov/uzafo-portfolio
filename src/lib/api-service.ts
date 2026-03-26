import {authFetch} from '@/lib/auth';
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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await authFetch(path, {
    ...init,
    headers
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchProfile(): Promise<Profile> {
  return apiFetch<Profile>('/api/profile');
}

export async function patchProfile(data: Partial<Profile>): Promise<Profile> {
  return apiFetch<Profile>('/api/profile', {method: 'PATCH', body: JSON.stringify(data)});
}

export async function fetchSite(): Promise<SiteData> {
  return apiFetch<SiteData>('/api/site');
}

export async function fetchProjects(): Promise<ApiListResponse<Project>> {
  return apiFetch<ApiListResponse<Project>>('/api/projects');
}

export async function createProject(data: Project): Promise<Project> {
  return apiFetch<Project>('/api/projects', {method: 'POST', body: JSON.stringify(data)});
}

export async function updateProject(slug: string, data: Partial<Project>): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${slug}`, {method: 'PATCH', body: JSON.stringify(data)});
}

export async function deleteProject(slug: string): Promise<void> {
  await apiFetch<void>(`/api/projects/${slug}`, {method: 'DELETE'});
}

export async function fetchPosts(): Promise<ApiListResponse<BlogPost>> {
  return apiFetch<ApiListResponse<BlogPost>>('/api/posts');
}

export async function createPost(data: BlogPost): Promise<BlogPost> {
  return apiFetch<BlogPost>('/api/posts', {method: 'POST', body: JSON.stringify(data)});
}

export async function updatePost(slug: string, data: Partial<BlogPost>): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/posts/${slug}`, {method: 'PATCH', body: JSON.stringify(data)});
}

export async function deletePostApi(slug: string): Promise<void> {
  await apiFetch<void>(`/api/posts/${slug}`, {method: 'DELETE'});
}

export async function addComment(
  slug: string,
  comment: {author: string; message: string}
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/posts/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment)
  });
}

export async function deleteComment(slug: string, commentId: string): Promise<void> {
  await apiFetch<void>(`/api/posts/${slug}/comments/${commentId}`, {method: 'DELETE'});
}

export async function likePost(slug: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/posts/${slug}/like`, {method: 'POST'});
}

export async function fetchDiscussions(): Promise<ApiListResponse<Discussion>> {
  return apiFetch<ApiListResponse<Discussion>>('/api/discussions');
}

export async function createDiscussion(data: Discussion): Promise<Discussion> {
  return apiFetch<Discussion>('/api/discussions', {method: 'POST', body: JSON.stringify(data)});
}

export async function updateDiscussion(slug: string, data: Partial<Discussion>): Promise<Discussion> {
  return apiFetch<Discussion>(`/api/discussions/${slug}`, {method: 'PATCH', body: JSON.stringify(data)});
}

export async function deleteDiscussion(slug: string): Promise<void> {
  await apiFetch<void>(`/api/discussions/${slug}`, {method: 'DELETE'});
}

export async function addReply(
  slug: string,
  reply: {text: string}
): Promise<Discussion> {
  return apiFetch<Discussion>(`/api/discussions/${slug}/replies`, {
    method: 'POST',
    body: JSON.stringify(reply)
  });
}

export async function deleteReply(slug: string, replyId: string): Promise<void> {
  await apiFetch<void>(`/api/discussions/${slug}/replies/${replyId}`, {method: 'DELETE'});
}

export async function fetchResume(): Promise<ResumeData> {
  return apiFetch<ResumeData>('/api/resume');
}

export async function patchResume(data: Partial<ResumeData>): Promise<ResumeData> {
  return apiFetch<ResumeData>('/api/resume', {method: 'PATCH', body: JSON.stringify(data)});
}

export async function fetchAdminUsers(): Promise<ApiListResponse<MockUser>> {
  return apiFetch<ApiListResponse<MockUser>>('/api/admin/users');
}

export async function syncProfile(data: Profile): Promise<Profile> {
  return apiFetch<Profile>('/api/admin/sync/profile', {method: 'PUT', body: JSON.stringify(data)});
}

export async function syncResume(data: ResumeData): Promise<ResumeData> {
  return apiFetch<ResumeData>('/api/admin/sync/resume', {method: 'PUT', body: JSON.stringify(data)});
}

export async function syncProjects(items: Project[]): Promise<ApiListResponse<Project>> {
  return apiFetch<ApiListResponse<Project>>('/api/admin/sync/projects', {method: 'PUT', body: JSON.stringify({items})});
}

export async function syncPosts(items: BlogPost[]): Promise<ApiListResponse<BlogPost>> {
  return apiFetch<ApiListResponse<BlogPost>>('/api/admin/sync/posts', {method: 'PUT', body: JSON.stringify({items})});
}

export async function syncDiscussions(items: Discussion[]): Promise<ApiListResponse<Discussion>> {
  return apiFetch<ApiListResponse<Discussion>>('/api/admin/sync/discussions', {method: 'PUT', body: JSON.stringify({items})});
}
