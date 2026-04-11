'use client';

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  FolderKanban,
  GitBranch,
  Globe,
  Mail,
  MapPin,
  NotebookText,
  Phone,
  UserRound,
  Users
} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {HeroRoles} from '@/components/home/hero-roles';
import {HomeReveal} from '@/components/home/home-reveal';
import {LatestBlogPreview} from '@/components/home/latest-blog-preview';
import {LatestDiscussionPreview} from '@/components/home/latest-discussion-preview';
import {RandomProjectPreview} from '@/components/home/random-project-preview';
import {Container} from '@/components/ui/container';
import {Link} from '@/i18n/navigation';
import {formatPhoneHref} from '@/lib/contact';
import {useManagedBlogPosts, useManagedDiscussions, useManagedProfile, useManagedProjects} from '@/lib/demo-store';
import type {BlogPost, Discussion, Locale, Profile, Project} from '@/lib/types';
import {pickStableProject, resolveLocaleText} from '@/lib/utils';

const statIcons = [BarChart3, GitBranch, Globe, Users];
const quickLinkMeta = [
  {key: 'portfolio', href: '/portfolio', icon: FolderKanban},
  {key: 'blog', href: '/blog', icon: NotebookText},
  {key: 'about', href: '/about', icon: UserRound},
] as const;

export function HomePageClient({
  initialProfile,
  initialProjects,
  initialBlogPosts,
  initialDiscussions,
}: {
  initialProfile: Profile;
  initialProjects: Project[];
  initialBlogPosts: BlogPost[];
  initialDiscussions: Discussion[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('home');
  const common = useTranslations('common');
  const [profile] = useManagedProfile(initialProfile);
  const [projects] = useManagedProjects(initialProjects);
  const [blogPosts] = useManagedBlogPosts(initialBlogPosts);
  const [discussions] = useManagedDiscussions(initialDiscussions);

  const featuredPost = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).find((post) => post.featured) ?? blogPosts[0] ?? null;
  const latestDiscussion = [...discussions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const project = pickStableProject(projects);
  const phoneHref = formatPhoneHref(profile.phone);

  return (
    <>
      <HeroRoles />
      <section className="py-14 sm:py-18">
        <Container className="space-y-16 sm:space-y-20">
          <HomeReveal>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {profile.stats.map((stat, index) => {
                const Icon = statIcons[index % statIcons.length];

                return (
                  <div
                    key={`${resolveLocaleText(stat.label, locale)}-${stat.value}`}
                    className="group relative overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1"
                    style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                      style={{background: 'radial-gradient(circle at 0% 0%, rgba(34,211,238,0.12), transparent 45%)'}}
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm" style={{color: 'var(--text-4)'}}>
                          {resolveLocaleText(stat.label, locale)}
                        </p>
                        <p className="mt-4 text-3xl font-bold" style={{color: 'var(--text-1)'}}>
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-[16px]" style={{background: 'var(--accent-m)'}}>
                        <Icon className="h-4 w-4" style={{color: 'var(--accent)'}} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </HomeReveal>

          <HomeReveal delay={0.04}>
            <section className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-end">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                  {common('exploreMore')}
                </p>
                <h2 className="text-2xl font-semibold sm:text-3xl" style={{color: 'var(--text-1)'}}>
                  {t('exploreTitle')}
                </h2>
                <p className="text-sm leading-7" style={{color: 'var(--text-4)'}}>
                  {t('exploreSubtitle')}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {quickLinkMeta.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1"
                      style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{background: 'linear-gradient(135deg, rgba(34,211,238,0.10), transparent 55%)'}}
                      />
                      <div className="relative flex h-full flex-col justify-between gap-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px]" style={{background: 'var(--accent-m)'}}>
                            <Icon className="h-5 w-5" style={{color: 'var(--accent)'}} />
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{color: 'var(--accent)'}}>
                            {t(`quickLinks.${item.key}.kicker`)}
                          </p>
                          <h3 className="mt-3 text-lg font-semibold" style={{color: 'var(--text-1)'}}>
                            {t(`quickLinks.${item.key}.title`)}
                          </h3>
                          <p className="mt-2 text-sm leading-6" style={{color: 'var(--text-3)'}}>
                            {t(`quickLinks.${item.key}.description`)}
                          </p>
                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{color: 'var(--text-2)'}}>
                            {common('exploreMore')}
                            <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </HomeReveal>

          <HomeReveal delay={0.08}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                {common('latest')}
              </p>
              <h2 className="text-2xl font-semibold sm:text-3xl" style={{color: 'var(--text-1)'}}>
                {t('showcaseTitle')}
              </h2>
              <p className="text-sm leading-7" style={{color: 'var(--text-4)'}}>
                {t('showcaseSubtitle')}
              </p>
            </div>
          </HomeReveal>

          <div className="grid gap-5">
            {featuredPost ? (
              <HomeReveal delay={0.1}>
                <LatestBlogPreview post={featuredPost} />
              </HomeReveal>
            ) : null}
            {latestDiscussion ? (
              <HomeReveal delay={0.12}>
                <LatestDiscussionPreview discussion={latestDiscussion} />
              </HomeReveal>
            ) : null}
            {project ? (
              <HomeReveal delay={0.14}>
                <RandomProjectPreview project={project} />
              </HomeReveal>
            ) : null}
          </div>

          <HomeReveal delay={0.16}>
            <section
              className="relative overflow-hidden rounded-[32px] border p-6 sm:p-8"
              style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-full"
                style={{background: 'radial-gradient(circle at 0% 0%, rgba(34,211,238,0.14), transparent 38%)'}}
              />
              <div className="relative grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                    {t('availabilityBadge')}
                  </p>
                  <h3 className="max-w-2xl text-2xl font-semibold sm:text-3xl" style={{color: 'var(--text-1)'}}>
                    {t('availabilityTitle')}
                  </h3>
                  <p className="max-w-2xl text-sm leading-7" style={{color: 'var(--text-3)'}}>
                    {t('availabilitySubtitle')}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <a
                    href={`mailto:${profile.email}`}
                    className="group rounded-[24px] border p-5 transition duration-300 hover:-translate-y-1"
                    style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px]" style={{background: 'var(--accent-m)'}}>
                        <Mail className="h-5 w-5" style={{color: 'var(--accent)'}} />
                      </div>
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" style={{color: 'var(--text-4)'}} />
                    </div>
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                      {t('availabilityEmail')}
                    </p>
                    <p className="mt-2 break-all text-base font-semibold sm:text-lg" style={{color: 'var(--text-1)'}}>
                      {profile.email}
                    </p>
                  </a>

                  <a
                    href={phoneHref}
                    className="group rounded-[24px] border p-5 transition duration-300 hover:-translate-y-1"
                    style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px]" style={{background: 'var(--accent-m)'}}>
                        <Phone className="h-5 w-5" style={{color: 'var(--accent)'}} />
                      </div>
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" style={{color: 'var(--text-4)'}} />
                    </div>
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                      {t('availabilityPhone')}
                    </p>
                    <p className="mt-2 text-base font-semibold sm:text-lg" style={{color: 'var(--text-1)'}}>
                      {profile.phone}
                    </p>
                  </a>

                  <div
                    className="rounded-[24px] border p-5 sm:col-span-2"
                    style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px]" style={{background: 'var(--accent-m)'}}>
                        <MapPin className="h-5 w-5" style={{color: 'var(--accent)'}} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                          {t('availabilityLocation')}
                        </p>
                        <p className="text-base font-semibold" style={{color: 'var(--text-1)'}}>
                          {profile.location}
                        </p>
                        <p className="text-sm leading-6" style={{color: 'var(--text-3)'}}>
                          {resolveLocaleText(profile.tagline, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </HomeReveal>
        </Container>
      </section>
    </>
  );
}
