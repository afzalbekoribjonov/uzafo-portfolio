import type {BlogPost, Discussion, Profile, Project, ResumeData} from '@/lib/types';

export interface ProfileDto extends Profile {}
export interface ProjectDto extends Project {}
export interface BlogPostDto extends BlogPost {}
export interface DiscussionDto extends Discussion {}
export interface ResumeDto extends ResumeData {}

export function buildContractSamples({
  profile,
  projects,
  blogPosts,
  discussions,
  resume
}: {
  profile: Profile;
  projects: Project[];
  blogPosts: BlogPost[];
  discussions: Discussion[];
  resume: ResumeData;
}) {
  return {
    profile: {
      endpoint: '/api/profile',
      methods: ['GET', 'PATCH'],
      payload: profile
    },
    projects: {
      endpoint: '/api/projects',
      methods: ['GET', 'POST'],
      payload: {items: projects, total: projects.length}
    },
    projectDetail: {
      endpoint: '/api/projects/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
      payload: projects[0] ?? null
    },
    blogPosts: {
      endpoint: '/api/posts',
      methods: ['GET', 'POST'],
      payload: {items: blogPosts, total: blogPosts.length}
    },
    blogPostDetail: {
      endpoint: '/api/posts/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
      payload: blogPosts[0] ?? null
    },
    blogComments: {
      endpoint: '/api/posts/:slug/comments',
      methods: ['POST'],
      payload: blogPosts[0]?.comments[0] ?? null
    },
    blogCommentDetail: {
      endpoint: '/api/posts/:slug/comments/:commentId',
      methods: ['DELETE'],
      payload: null
    },
    discussions: {
      endpoint: '/api/discussions',
      methods: ['GET', 'POST'],
      payload: {items: discussions, total: discussions.length}
    },
    discussionDetail: {
      endpoint: '/api/discussions/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
      payload: discussions[0] ?? null
    },
    discussionReplies: {
      endpoint: '/api/discussions/:slug/replies',
      methods: ['POST'],
      payload: {
        text: discussions[0]?.messages[0]?.text ?? '<p>Sample reply</p>'
      }
    },
    discussionReplyDetail: {
      endpoint: '/api/discussions/:slug/replies/:replyId',
      methods: ['DELETE'],
      payload: null
    },
    resume: {
      endpoint: '/api/resume',
      methods: ['GET', 'PATCH'],
      payload: resume
    }
  };
}
