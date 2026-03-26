export type Locale = 'uz' | 'en';

export type LocalizedString = Record<Locale, string>;
export type TextValue = string | LocalizedString;

export interface SiteData {
  brand: string;
  tagline: LocalizedString;
  socials: Array<{name: string; href: string}>;
  resumePdf: string;
  status: LocalizedString;
}

export interface Profile {
  name: string;
  tagline: TextValue;
  summary: TextValue;
  location: string;
  email: string;
  phone: string;
  availability: TextValue;
  university: {
    name: string;
    degree: TextValue;
  };
  experienceYears: number;
  techCategories: Array<{
    key: string;
    title: TextValue;
    items: string[];
  }>;
  skillMetrics: Array<{name: string; level: number}>;
  timeline: Array<{
    year: string;
    title: TextValue;
    description: TextValue;
  }>;
  stats: Array<{
    label: TextValue;
    value: string;
  }>;
}

export interface ProjectMetric {
  label: TextValue;
  value: string;
}

export interface ContentTextBlock {
  id: string;
  type: 'richText' | 'quote';
  content: TextValue;
}

export interface ContentCodeBlock {
  id: string;
  type: 'code';
  language: string;
  content: TextValue;
}

export interface ContentImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt: TextValue;
}

export interface ContentVideoBlock {
  id: string;
  type: 'video';
  src: string;
  caption: TextValue;
}

export type ContentBlock = ContentTextBlock | ContentCodeBlock | ContentImageBlock | ContentVideoBlock;
export type BlogBlock = ContentBlock;

export interface ProjectLink {
  id: string;
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: TextValue;
  excerpt: TextValue;
  description: TextValue;
  year: string;
  status: TextValue;
  cover: string;
  tags: string[];
  metrics: ProjectMetric[];
  links?: ProjectLink[];
  content?: ContentBlock[];
}

export interface BlogComment {
  id: string;
  author: string;
  message: TextValue;
  createdAt?: string;
}

export interface BlogPost {
  slug: string;
  title: TextValue;
  excerpt: TextValue;
  cover: string;
  publishedAt: string;
  author: {
    name: string;
    role: TextValue;
  };
  readingTime: number;
  likes: number;
  dislikes: number;
  featured: boolean;
  blocks: BlogBlock[];
  comments: BlogComment[];
}

export interface DiscussionMessage {
  id: string;
  author: {
    name: string;
    badge: TextValue;
  };
  text: TextValue;
  createdAt: string;
}

export interface Discussion {
  slug: string;
  title: TextValue;
  category: TextValue;
  createdAt: string;
  author: {
    name: string;
    avatar: string;
    title: TextValue;
  };
  summary: TextValue;
  content: TextValue;
  messages: DiscussionMessage[];
}

export interface ResumeExperience {
  company: string;
  role: TextValue;
  period: string;
  highlights: Record<string, string[]>;
}

export interface ResumeEducation {
  institution: string;
  degree: TextValue;
  period: string;
}

export interface ResumeAward {
  title: TextValue;
  description: TextValue;
}

export interface ResumeData {
  headline: TextValue;
  summary: TextValue;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: Record<string, string[]>;
  awards: ResumeAward[];
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}

export interface ChatAction {
  type: 'prompt' | 'route' | 'external' | 'copy';
  label: TextValue;
  value?: string;
  href?: string;
}

export interface ChatIntent {
  id: string;
  keywords: string[];
  reply: TextValue;
  actions?: ChatAction[];
}

export interface ChatKnowledge {
  greeting: TextValue;
  fallback: TextValue;
  quickPrompts: ChatAction[];
  quickRoutes: ChatAction[];
  intents: ChatIntent[];
}

export interface DemoSession {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export type ApiListResponse<T> = {
  items: T[];
  total: number;
};
