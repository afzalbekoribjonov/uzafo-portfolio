import type {BlogPost, ContentBlock, Discussion, DiscussionMessage, Profile, Project, ResumeData, TextValue} from '@/lib/types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeTextValue(value: unknown, fallback = ''): TextValue {
  if (typeof value === 'string') return value;
  if (isObject(value)) {
    const uz = typeof value.uz === 'string' ? value.uz : undefined;
    const en = typeof value.en === 'string' ? value.en : undefined;
    if (uz !== undefined || en !== undefined) {
      return {
        uz: uz ?? en ?? fallback,
        en: en ?? uz ?? fallback
      };
    }
    const firstString = Object.values(value).find((item) => typeof item === 'string');
    if (typeof firstString === 'string') return firstString;
  }
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function hasHtml(value: string) {
  return /<[^>]+>/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function wrapHtmlValue(value: TextValue, tag = 'p'): TextValue {
  if (typeof value === 'string') {
    return hasHtml(value) ? value : `<${tag}>${escapeHtml(value)}</${tag}>`;
  }

  return {
    uz: hasHtml(value.uz) ? value.uz : `<${tag}>${escapeHtml(value.uz)}</${tag}>`,
    en: hasHtml(value.en) ? value.en : `<${tag}>${escapeHtml(value.en)}</${tag}>`
  };
}

export function normalizeContentBlocks(blocks: unknown, prefix: string): ContentBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((rawBlock, index) => {
    const block = isObject(rawBlock) ? rawBlock : {};
    const type = typeof block.type === 'string' ? block.type : 'richText';
    const id = typeof block.id === 'string' ? block.id : `${prefix}-block-${index}`;

    if (type === 'image') {
      return {
        id,
        type: 'image' as const,
        src: typeof block.src === 'string' ? block.src.trim() : '',
        alt: normalizeTextValue(block.alt, '')
      };
    }

    if (type === 'video') {
      return {
        id,
        type: 'video' as const,
        src: typeof block.src === 'string' ? block.src.trim() : '',
        caption: normalizeTextValue(block.caption ?? block.alt, '')
      };
    }

    if (type === 'code') {
      return {
        id,
        type: 'code' as const,
        language: typeof block.language === 'string' && block.language.trim() ? block.language : 'txt',
        content: normalizeTextValue(block.content, '')
      };
    }

    if (type === 'quote') {
      return {
        id,
        type: 'quote' as const,
        content: wrapHtmlValue(normalizeTextValue(block.content, ''), 'p')
      };
    }

    if (type === 'paragraph') {
      return {
        id,
        type: 'richText' as const,
        content: wrapHtmlValue(normalizeTextValue(block.content, ''), 'p')
      };
    }

    if (type === 'heading') {
      return {
        id,
        type: 'richText' as const,
        content: wrapHtmlValue(normalizeTextValue(block.content, ''), 'h2')
      };
    }

    return {
      id,
      type: 'richText' as const,
      content: wrapHtmlValue(normalizeTextValue(block.content, ''), 'p')
    };
  });
}

function normalizeComments(comments: unknown, prefix: string, fallbackDate: string) {
  if (!Array.isArray(comments)) return [];

  return comments.map((rawComment, index) => {
    const comment = isObject(rawComment) ? rawComment : {};
    return {
      id: typeof comment.id === 'string' ? comment.id : `${prefix}-comment-${index}`,
      author: typeof comment.author === 'string' && comment.author.trim() ? comment.author : 'Guest',
      message: normalizeTextValue(comment.message, ''),
      createdAt: typeof comment.createdAt === 'string' ? comment.createdAt : fallbackDate
    };
  });
}

export function normalizeBlogPosts(raw: unknown): BlogPost[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((rawPost, index) => {
    const post = isObject(rawPost) ? rawPost : {};
    const slug = typeof post.slug === 'string' ? post.slug : `post-${index}`;
    const publishedAt = typeof post.publishedAt === 'string' ? post.publishedAt : '2026-01-01';
    const author = isObject(post.author) ? post.author : {};

    return {
      slug,
      title: normalizeTextValue(post.title, 'Untitled post'),
      excerpt: normalizeTextValue(post.excerpt, ''),
      cover: typeof post.cover === 'string' ? post.cover.trim() : '',
      publishedAt,
      author: {
        name: typeof author.name === 'string' && author.name.trim() ? author.name : 'Afzalbek Oribjonov',
        role: normalizeTextValue(author.role, 'Developer')
      },
      readingTime: typeof post.readingTime === 'number' ? post.readingTime : 1,
      likes: typeof post.likes === 'number' ? post.likes : 0,
      dislikes: typeof post.dislikes === 'number' ? post.dislikes : 0,
      featured: Boolean(post.featured),
      blocks: normalizeContentBlocks(post.blocks, slug),
      comments: normalizeComments(post.comments, slug, publishedAt)
    };
  });
}

export function normalizeProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((rawProject, index) => {
    const project = isObject(rawProject) ? rawProject : {};
    const slug = typeof project.slug === 'string' ? project.slug : `project-${index}`;
    const metrics = Array.isArray(project.metrics) ? project.metrics : [];
    const links = Array.isArray(project.links) ? project.links : [];
    const content = normalizeContentBlocks(project.content, slug);
    const description = normalizeTextValue(project.description, '');

    return {
      slug,
      title: normalizeTextValue(project.title, 'Untitled project'),
      excerpt: normalizeTextValue(project.excerpt, ''),
      description,
      year: typeof project.year === 'string' ? project.year : '2026',
      status: normalizeTextValue(project.status, 'In progress'),
      cover: typeof project.cover === 'string' ? project.cover.trim() : '',
      tags: Array.isArray(project.tags) ? project.tags.filter((item): item is string => typeof item === 'string') : [],
      metrics: metrics.map((rawMetric, metricIndex) => {
        const metric = isObject(rawMetric) ? rawMetric : {};
        return {
          label: normalizeTextValue(metric.label, `Metric ${metricIndex + 1}`),
          value: typeof metric.value === 'string' ? metric.value : ''
        };
      }),
      links: links.map((rawLink, linkIndex) => {
        const link = isObject(rawLink) ? rawLink : {};
        return {
          id: typeof link.id === 'string' ? link.id : `${slug}-link-${linkIndex}`,
          label: typeof link.label === 'string' ? link.label : 'Link',
          href: typeof link.href === 'string' ? link.href : '#'
        };
      }),
      content: content.length > 0 ? content : [{id: `${slug}-overview`, type: 'richText' as const, content: wrapHtmlValue(description, 'p')}]
    };
  });
}

export function normalizeDiscussions(raw: unknown): Discussion[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((rawDiscussion, index) => {
    const discussion = isObject(rawDiscussion) ? rawDiscussion : {};
    const slug = typeof discussion.slug === 'string' ? discussion.slug : `discussion-${index}`;
    const author = isObject(discussion.author) ? discussion.author : {};
    const messages = Array.isArray(discussion.messages) ? discussion.messages : [];

    return {
      slug,
      title: normalizeTextValue(discussion.title, 'Untitled discussion'),
      category: normalizeTextValue(discussion.category, 'General'),
      createdAt: typeof discussion.createdAt === 'string' ? discussion.createdAt : '2026-01-01T00:00:00Z',
      author: {
        name: typeof author.name === 'string' && author.name.trim() ? author.name : 'Guest',
        avatar: typeof author.avatar === 'string' ? author.avatar : 'AF',
        title: normalizeTextValue(author.title, 'Community member')
      },
      summary: normalizeTextValue(discussion.summary, ''),
      content: wrapHtmlValue(normalizeTextValue(discussion.content, ''), 'p'),
      messages: messages.map((rawMessage, messageIndex) => {
        const message = isObject(rawMessage) ? rawMessage : {};
        const messageAuthor = isObject(message.author) ? message.author : {};
        return {
          id: typeof message.id === 'string' ? message.id : `${slug}-reply-${messageIndex}`,
          author: {
            name: typeof messageAuthor.name === 'string' && messageAuthor.name.trim() ? messageAuthor.name : 'Guest',
            badge: normalizeTextValue(messageAuthor.badge, 'Member')
          },
          text: wrapHtmlValue(normalizeTextValue(message.text, ''), 'p'),
          createdAt: typeof message.createdAt === 'string' ? message.createdAt : '2026-01-01T00:00:00Z'
        } satisfies DiscussionMessage;
      })
    };
  });
}

export function normalizeProfile(raw: unknown): Profile {
  const profile = isObject(raw) ? raw : {};
  const university = isObject(profile.university) ? profile.university : {};
  const techCategories = Array.isArray(profile.techCategories) ? profile.techCategories : [];
  const skillMetrics = Array.isArray(profile.skillMetrics) ? profile.skillMetrics : [];
  const timeline = Array.isArray(profile.timeline) ? profile.timeline : [];
  const stats = Array.isArray(profile.stats) ? profile.stats : [];

  return {
    name: typeof profile.name === 'string' && profile.name.trim() ? profile.name : 'Afzalbek Oribjonov',
    tagline: normalizeTextValue(profile.tagline, 'Developer'),
    summary: normalizeTextValue(profile.summary, ''),
    location: typeof profile.location === 'string' ? profile.location : 'Tashkent, Uzbekistan',
    email: typeof profile.email === 'string' ? profile.email : '',
    phone: typeof profile.phone === 'string' && profile.phone.trim() ? profile.phone : '+998 94 108 09 16',
    availability: normalizeTextValue(profile.availability, 'Available for selected collaborations'),
    university: {
      name: typeof university.name === 'string' ? university.name : 'Sharda University',
      degree: normalizeTextValue(university.degree, 'BTech, AI & ML with CSE')
    },
    experienceYears: typeof profile.experienceYears === 'number' ? profile.experienceYears : 4,
    techCategories: techCategories.map((rawCategory, index) => {
      const category = isObject(rawCategory) ? rawCategory : {};
      return {
        key: typeof category.key === 'string' ? category.key : `category-${index}`,
        title: normalizeTextValue(category.title, `Category ${index + 1}`),
        items: Array.isArray(category.items) ? category.items.filter((item): item is string => typeof item === 'string') : []
      };
    }),
    skillMetrics: skillMetrics.map((rawMetric, index) => {
      const metric = isObject(rawMetric) ? rawMetric : {};
      return {
        name: typeof metric.name === 'string' ? metric.name : `Skill ${index + 1}`,
        level: typeof metric.level === 'number' ? metric.level : 0
      };
    }),
    timeline: timeline.map((rawItem, index) => {
      const item = isObject(rawItem) ? rawItem : {};
      return {
        year: typeof item.year === 'string' ? item.year : String(2021 + index),
        title: normalizeTextValue(item.title, `Milestone ${index + 1}`),
        description: normalizeTextValue(item.description, '')
      };
    }),
    stats: stats.map((rawStat, index) => {
      const stat = isObject(rawStat) ? rawStat : {};
      return {
        label: normalizeTextValue(stat.label, `Stat ${index + 1}`),
        value: typeof stat.value === 'string' ? stat.value : ''
      };
    })
  };
}

export function normalizeResume(raw: unknown): ResumeData {
  const resume = isObject(raw) ? raw : {};
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const awards = Array.isArray(resume.awards) ? resume.awards : [];
  const skills = isObject(resume.skills) ? resume.skills : {};

  return {
    headline: normalizeTextValue(resume.headline, ''),
    summary: normalizeTextValue(resume.summary, ''),
    experience: experience.map((rawItem) => {
      const item = isObject(rawItem) ? rawItem : {};
      return {
        company: typeof item.company === 'string' ? item.company : '',
        role: normalizeTextValue(item.role, ''),
        period: typeof item.period === 'string' ? item.period : '',
        highlights: isObject(item.highlights) ? Object.fromEntries(Object.entries(item.highlights).map(([key, value]) => [key, Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []])) : {}
      };
    }),
    education: education.map((rawItem) => {
      const item = isObject(rawItem) ? rawItem : {};
      return {
        institution: typeof item.institution === 'string' ? item.institution : '',
        degree: normalizeTextValue(item.degree, ''),
        period: typeof item.period === 'string' ? item.period : ''
      };
    }),
    skills: Object.fromEntries(Object.entries(skills).map(([key, value]) => [key, Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []])),
    awards: awards.map((rawItem) => {
      const item = isObject(rawItem) ? rawItem : {};
      return {
        title: normalizeTextValue(item.title, ''),
        description: normalizeTextValue(item.description, '')
      };
    })
  };
}
