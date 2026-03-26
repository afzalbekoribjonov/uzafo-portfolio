import {getBlogPosts, getDiscussions, getProjects, getUsers} from '@/lib/data';

export async function GET() {
  const [projects, posts, discussions, users] = await Promise.all([
    getProjects(),
    getBlogPosts(),
    getDiscussions(),
    getUsers(),
  ]);
  return Response.json({
    projects: projects.length,
    posts: posts.length,
    discussions: discussions.length,
    users: users.length
  });
}
