import {setRequestLocale} from 'next-intl/server';
import {AdminHomeClient} from '@/components/admin/admin-home-client';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {getBlogPosts, getDiscussions, getProfile, getProjects, getResume, getUsers} from '@/lib/data';
import {buildPageMetadata, NON_INDEXABLE_ROBOTS} from '@/lib/metadata';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return buildPageMetadata('admin', locale, {robots: NON_INDEXABLE_ROBOTS});
}

export default async function AdminPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const [profile, projects, blogPosts, resume, discussions, users] = await Promise.all([
    getProfile(),
    getProjects(),
    getBlogPosts(),
    getResume(),
    getDiscussions(),
    getUsers(),
  ]);

  return (
    <>
      <PageHero title="Admin Dashboard" subtitle="Use this control room to open the exact page you want to edit. The real editing experience happens inside the live page itself." eyebrow="ADMIN" />
      <section className="py-16 sm:py-20">
        <Container>
          <AdminHomeClient
            initialProfile={profile}
            initialProjects={projects}
            initialBlogPosts={blogPosts}
            initialResume={resume}
            initialDiscussions={discussions}
            users={users}
          />
        </Container>
      </section>
    </>
  );
}
