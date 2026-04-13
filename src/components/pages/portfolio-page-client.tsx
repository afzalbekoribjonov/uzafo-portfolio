'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {ArrowRight, ChevronLeft, ChevronRight, ExternalLink, LayoutPanelTop, PanelsTopLeft, Plus, Trash2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {getPortfolioLinkCaption, isPublicPortfolioProject, isUsablePortfolioLink, normalizePortfolioHref} from '@/components/pages/portfolio-project-helpers';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {createProject as createProjectApi, deleteProject as deleteProjectApi} from '@/lib/api-service';
import {useManagedProjects} from '@/lib/demo-store';
import type {Locale, Project, ProjectLink} from '@/lib/types';
import {makeId, normalizeProject, resolveText} from '@/lib/utils';

type PortfolioViewMode = 'editorial' | 'carousel';
const EDITORIAL_SUMMARY_LIMIT = 150;
const CAROUSEL_SUMMARY_LIMIT = 210;

function wrapIndex(index: number, total: number) {
  if (total === 0) return 0;
  return (index % total + total) % total;
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  const safeSlice = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${safeSlice.trimEnd()}...`;
}

function getProjectSummary(project: Project, locale: Locale, maxLength: number) {
  const excerpt = resolveText(project.excerpt, locale).trim();
  const description = resolveText(project.description, locale).trim();
  return truncateText(excerpt || description, maxLength);
}

function ProjectLinks({links, compact = false}: {links: ProjectLink[]; compact?: boolean}) {
  if (links.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2.5 ${compact ? '' : 'pt-1'}`}>
      {links.map((link) => (
        <a
          key={link.id}
          href={normalizePortfolioHref(link.href)}
          target="_blank"
          rel="noreferrer"
          className={`group inline-flex min-w-0 items-center gap-3 rounded-[20px] border transition hover:-translate-y-0.5 ${
            compact
              ? 'bg-white/10 px-3 py-2'
              : 'bg-white/5 px-3.5 py-2.5'
          }`}
          style={{borderColor: 'var(--border-1)'}}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{link.label}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{getPortfolioLinkCaption(link.href)}</span>
          </span>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/20">
            <ExternalLink className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </a>
      ))}
    </div>
  );
}

function EditorialProjectCard({
  project,
  index,
  locale,
  openLabel,
  onDelete,
  isAdmin
}: {
  project: Project;
  index: number;
  locale: Locale;
  openLabel: string;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const visibleLinks = (project.links ?? []).filter(isUsablePortfolioLink);
  const featuredMetrics = project.metrics.slice(0, 3);
  const reverse = index % 2 !== 0;
  const projectSummary = getProjectSummary(project, locale, EDITORIAL_SUMMARY_LIMIT);

  return (
    <motion.article
      layout
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={{duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1]}}
      className="group relative mx-auto max-w-[1080px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_18px_60px_rgba(2,6,23,0.18)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_32%)]" />
      <div className={`relative grid gap-0 ${reverse ? 'lg:grid-cols-[1fr_300px]' : 'lg:grid-cols-[300px_1fr]'}`}>
        <div className={`relative min-h-[200px] overflow-hidden sm:min-h-[220px] ${reverse ? 'lg:order-2' : ''}`}>
          <DynamicMedia
            src={project.cover}
            alt={resolveText(project.title, locale)}
            className="h-full min-h-[200px] sm:min-h-[220px]"
            controls={false}
            mediaClassName="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            placeholderTitle={resolveText(project.title, locale)}
            placeholderHint=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-slate-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300 backdrop-blur">
              Case Study {String(index + 1).padStart(2, '0')}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/90 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
              {project.year}
            </span>
          </div>
        </div>

        <div className={`relative flex flex-col justify-between p-4 sm:p-5 lg:p-6 ${reverse ? 'lg:order-1' : ''}`}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-400">
                {resolveText(project.status, locale)}
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-[1.65rem] sm:leading-[1.08]">
                {resolveText(project.title, locale)}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                {projectSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            {featuredMetrics.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {featuredMetrics.map((metric, metricIndex) => (
                  <div key={`${metric.value}-${metricIndex}`} className="rounded-[18px] border border-white/10 bg-white/10 p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{resolveText(metric.label, locale)}</p>
                    <p className="mt-1.5 text-sm font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <ProjectLinks links={visibleLinks} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/portfolio/${project.slug}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              {openLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
          <Link
            href={`/portfolio/${project.slug}?edit=1`}
            className="rounded-full border border-cyan-300/20 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur transition hover:bg-cyan-400/10"
            onClick={(event) => event.stopPropagation()}
          >
            Tahrirlash
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-rose-400/20 bg-slate-900/90 p-1.5 text-rose-300 backdrop-blur transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </motion.article>
  );
}

export function PortfolioPageClient({initialProjects}: {initialProjects: Project[]}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('portfolio');
  const common = useTranslations('common');
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const {isAdmin} = useDemoSession();
  const [projects, , , replaceProjects] = useManagedProjects(initialProjects);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>('editorial');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const visibleProjects = useMemo(
    () => isAdmin ? projects : projects.filter(isPublicPortfolioProject),
    [isAdmin, projects]
  );

  const createProject = async () => {
    const slug = `project-${Date.now()}`;
    const project = normalizeProject({
      slug,
      title: 'Yangi loyiha',
      excerpt: 'Loyiha natijasining qisqacha tavsifi.',
      description: 'Asosiy loyiha tavsifini bu yerga yozing.',
      year: String(new Date().getUTCFullYear()),
      status: 'Draft',
      cover: '',
      tags: ['Next.js', 'Python'],
      metrics: [{label: 'Role', value: 'Full-stack'}],
      links: [{id: makeId('link'), label: 'Demo', href: '#'}],
      content: [{id: makeId('block'), type: 'richText', content: '<h2>Loyiha haqida</h2><p>Bu yerga yozing.</p>'}]
    });
    try {
      const created = await createProjectApi(project);
      replaceProjects((current) => [created, ...current]);
      router.push(`/portfolio/${created.slug}?edit=1`);
    } catch (error) {
      console.error('Failed to create project.', error);
    }
  };

  const deleteProject = async (slug: string) => {
    try {
      await deleteProjectApi(slug);
      replaceProjects((current) => current.filter((project) => project.slug !== slug));
    } catch (error) {
      console.error(`Failed to delete project ${slug}.`, error);
      return;
    }
    setConfirmSlug(null);
  };

  const projectCountLabel = locale === 'uz'
    ? `${visibleProjects.length} ta loyiha`
    : `${visibleProjects.length} projects`;

  const safeActiveIndex = visibleProjects.length > 0 ? wrapIndex(activeIndex, visibleProjects.length) : 0;
  const activeProject = visibleProjects[safeActiveIndex] ?? null;

  const goToProject = (nextIndex: number, nextDirection: number) => {
    if (visibleProjects.length <= 1) return;
    setDirection(nextDirection);
    setActiveIndex(wrapIndex(nextIndex, visibleProjects.length));
  };

  return (
    <>
      {confirmSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-rose-400/20 bg-slate-900 p-6 shadow-2xl">
            <p className="font-semibold text-white">Loyihani o&apos;chirish</p>
            <p className="mt-2 text-sm text-slate-300">Bu amalni qaytarib bo&apos;lmaydi.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmSlug(null)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">Bekor</button>
              <button type="button" onClick={() => deleteProject(confirmSlug)} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">O&apos;chirish</button>
            </div>
          </div>
        </div>
      ) : null}

      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="PORTFOLIO" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-8">
          <div className="mx-auto max-w-[1080px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="space-y-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  {t('viewLabel')}
                </span>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                      {viewMode === 'editorial' ? t('viewEditorial') : t('viewCarousel')}
                    </h2>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300">
                      {projectCountLabel}
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm leading-7 text-slate-300">
                    {viewMode === 'editorial' ? t('viewEditorialHint') : t('viewCarouselHint')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="inline-flex rounded-[20px] border border-white/10 bg-white/10 p-1.5">
                  {([
                    {id: 'editorial', label: t('viewEditorial'), icon: LayoutPanelTop},
                    {id: 'carousel', label: t('viewCarousel'), icon: PanelsTopLeft}
                  ] as const).map(({id, label, icon: Icon}) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setViewMode(id)}
                      className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-medium transition ${
                        viewMode === id
                          ? 'bg-cyan-400 text-slate-950'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={createProject}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    <Plus className="h-4 w-4" /> Yangi loyiha
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {visibleProjects.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 py-16 text-center">
              <p className="text-base font-medium text-slate-300">Hali loyiha yo&apos;q</p>
              {isAdmin ? (
                <button type="button" onClick={createProject} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  <Plus className="h-4 w-4" /> Birinchi loyihani qo&apos;shing
                </button>
              ) : null}
            </div>
          ) : null}

          {visibleProjects.length > 0 && viewMode === 'editorial' ? (
            <div className="space-y-6">
              {visibleProjects.map((project, index) => (
                <EditorialProjectCard
                  key={project.slug}
                  project={project}
                  index={index}
                  locale={locale}
                  openLabel={common('openProject')}
                  onDelete={() => setConfirmSlug(project.slug)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : null}

          {visibleProjects.length > 0 && viewMode === 'carousel' && activeProject ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                    {String(safeActiveIndex + 1).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {t('carouselBadge')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToProject(safeActiveIndex - 1, -1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label={t('prevProject')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToProject(safeActiveIndex + 1, 1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition hover:bg-cyan-300"
                    aria-label={t('nextProject')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative mx-auto max-w-[1080px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_22px_80px_rgba(2,6,23,0.2)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.18))]" />

                <AnimatePresence initial={false} mode="wait" custom={direction}>
                  <motion.article
                    key={activeProject.slug}
                    custom={direction}
                    initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, x: direction > 0 ? 56 : -56, scale: 0.98}}
                    animate={prefersReducedMotion ? {opacity: 1} : {opacity: 1, x: 0, scale: 1}}
                    exit={prefersReducedMotion ? {opacity: 0} : {opacity: 0, x: direction > 0 ? -56 : 56, scale: 0.985}}
                    transition={{duration: prefersReducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1]}}
                    className="relative grid gap-0 lg:grid-cols-[minmax(0,0.98fr)_minmax(280px,0.82fr)]"
                  >
                    <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5 lg:p-6 xl:p-7">
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-cyan-300/25 bg-slate-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            {t('carouselSpotlight')}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300">
                            {activeProject.year}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300">
                            {resolveText(activeProject.status, locale)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-[2.15rem] sm:leading-[1.05]">
                            {resolveText(activeProject.title, locale)}
                          </h2>
                          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                            {getProjectSummary(activeProject, locale, CAROUSEL_SUMMARY_LIMIT)}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {activeProject.metrics.slice(0, 4).map((metric, index) => (
                            <div key={`${metric.value}-${index}`} className="rounded-[20px] border border-white/10 bg-white/10 p-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{resolveText(metric.label, locale)}</p>
                              <p className="mt-1.5 text-sm font-semibold text-white sm:text-base">{metric.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {activeProject.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <ProjectLinks links={(activeProject.links ?? []).filter(isUsablePortfolioLink)} compact />
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/portfolio/${activeProject.slug}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                        >
                          {common('openProject')}
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        {isAdmin ? (
                          <>
                            <Link
                              href={`/portfolio/${activeProject.slug}?edit=1`}
                              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                            >
                              Tahrirlash
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmSlug(activeProject.slug)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              O&apos;chirish
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="relative min-h-[240px] p-3 sm:p-4 lg:p-5">
                      <div className="absolute left-8 top-8 hidden h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl lg:block" />
                      <div className="absolute bottom-10 right-12 hidden h-28 w-28 rounded-full bg-sky-400/10 blur-3xl lg:block" />
                      <div className="relative h-full overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/70">
                        <DynamicMedia
                          src={activeProject.cover}
                          alt={resolveText(activeProject.title, locale)}
                          className="h-full min-h-[240px]"
                          controls={false}
                          mediaClassName="h-full w-full object-cover"
                          placeholderTitle={resolveText(activeProject.title, locale)}
                          placeholderHint=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                          <div className="rounded-[22px] border border-white/10 bg-slate-950/70 p-3.5 backdrop-blur">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{t('carouselPreview')}</p>
                            <p className="mt-2 text-base font-semibold text-white sm:text-lg">{resolveText(activeProject.title, locale)}</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-300">
                              {getProjectSummary(activeProject, locale, 110)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visibleProjects.map((project, index) => {
                  const isActive = index === safeActiveIndex;
                  return (
                    <button
                      key={project.slug}
                      type="button"
                      onClick={() => goToProject(index, index >= safeActiveIndex ? 1 : -1)}
                      className={`text-left rounded-[24px] border px-4 py-4 transition ${
                        isActive
                          ? 'border-cyan-300/30 bg-cyan-400/10'
                          : 'border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-cyan-300' : 'bg-white/10'}`} />
                      </div>
                      <p className="mt-3 line-clamp-2 text-base font-semibold text-white">{resolveText(project.title, locale)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {resolveText(project.excerpt, locale) || resolveText(project.description, locale)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
