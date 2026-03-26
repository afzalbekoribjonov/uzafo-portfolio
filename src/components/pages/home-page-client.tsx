'use client';

import {ArrowRight, BarChart3, GitBranch, Globe, Phone, Users} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {LatestBlogPreview} from '@/components/home/latest-blog-preview';
import {LatestDiscussionPreview} from '@/components/home/latest-discussion-preview';
import {RandomProjectPreview} from '@/components/home/random-project-preview';
import {HeroRoles} from '@/components/home/hero-roles';
import {Container} from '@/components/ui/container';
import {formatPhoneHref} from '@/lib/contact';
import {useManagedBlogPosts, useManagedDiscussions, useManagedProfile, useManagedProjects} from '@/lib/demo-store';
import type {BlogPost, Discussion, Locale, Profile, Project} from '@/lib/types';
import {pickStableProject, resolveLocaleText} from '@/lib/utils';

const statIcons = [BarChart3, GitBranch, Globe, Users];

export function HomePageClient({initialProfile, initialProjects, initialBlogPosts, initialDiscussions}: {
  initialProfile: Profile; initialProjects: Project[];
  initialBlogPosts: BlogPost[]; initialDiscussions: Discussion[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('home');
  const common = useTranslations('common');
  const [profile] = useManagedProfile(initialProfile);
  const [projects] = useManagedProjects(initialProjects);
  const [blogPosts] = useManagedBlogPosts(initialBlogPosts);
  const [discussions] = useManagedDiscussions(initialDiscussions);

  const featuredPost = [...blogPosts].sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).find(p => p.featured) ?? blogPosts[0] ?? null;
  const latestDiscussion = [...discussions].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const project = pickStableProject(projects);
  const phoneHref = formatPhoneHref(profile.phone);

  return (
    <>
      <HeroRoles />
      <section className="py-14 sm:py-18">
        <Container className="space-y-14">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {profile.stats.map((stat, i) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <div key={`${resolveLocaleText(stat.label,locale)}-${stat.value}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-white/15">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm" style={{color:'var(--text-4)'}}>{resolveLocaleText(stat.label, locale)}</p>
                      <p className="mt-3 text-3xl font-bold" style={{color:'var(--text-1)'}}>{stat.value}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{background:'var(--accent-m)'}}>
                      <Icon className="h-4 w-4" style={{color:'var(--accent)'}} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section header */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color:'var(--accent)'}}>{t('sectionsTitle')}</p>
            <h2 className="text-2xl font-semibold sm:text-3xl" style={{color:'var(--text-1)'}}>{resolveLocaleText(profile.tagline, locale)}</h2>
            <p className="text-sm leading-7" style={{color:'var(--text-4)'}}>{t('sectionsSubtitle')}</p>
          </div>

          {/* Preview cards */}
          <div className="grid gap-5">
            {featuredPost && <LatestBlogPreview post={featuredPost} />}
            {latestDiscussion && <LatestDiscussionPreview discussion={latestDiscussion} />}
            {project && <RandomProjectPreview project={project} />}
          </div>

          {/* Quick nav */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {href:'/portfolio', label:'Portfolio', desc:'Loyihalar va case study\'lar'},
              {href:'/blog',      label:'Blog',      desc:'Maqolalar va texnik yozuvlar'},
              {href:'/about',     label:'Haqimda',   desc:'Texnologiyalar va tajriba'},
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 transition hover:border-white/15 hover:bg-white/8">
                <div>
                  <p className="text-sm font-semibold" style={{color:'var(--text-1)'}}>{item.label}</p>
                  <p className="mt-0.5 text-xs" style={{color:'var(--text-4)'}}>{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" style={{color:'var(--text-4)'}} />
              </Link>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7">
            <div className="pointer-events-none absolute inset-0"
              style={{background:'radial-gradient(circle at 0% 100%, rgba(34,211,238,0.07),transparent 50%)'}} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color:'var(--accent)'}}>{common('contact')}</p>
                <h3 className="mt-1.5 text-xl font-semibold" style={{color:'var(--text-1)'}}>{resolveLocaleText(profile.availability, locale)}</h3>
                <p className="mt-1 text-sm" style={{color:'var(--text-3)'}}>{profile.location} · {profile.phone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={`mailto:${profile.email}`}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
                  {profile.email} <ArrowRight className="h-4 w-4" />
                </a>
                <a href={phoneHref}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                  style={{color:'var(--text-2)'}}>
                  <Phone className="h-4 w-4" /> {profile.phone}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
