'use client';

import {ArrowRight, ExternalLink, Plus, Trash2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {createProject as createProjectApi, deleteProject as deleteProjectApi} from '@/lib/api-service';
import {useManagedProjects} from '@/lib/demo-store';
import type {Locale, Project} from '@/lib/types';
import {makeId, normalizeProject, resolveText} from '@/lib/utils';

export function PortfolioPageClient({initialProjects}: {initialProjects: Project[]}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('portfolio');
  const common = useTranslations('common');
  const router = useRouter();
  const {isAdmin} = useDemoSession();
  const [projects, , , replaceProjects] = useManagedProjects(initialProjects);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

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

  return (
    <>
      {confirmSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-rose-400/20 bg-slate-900 p-6 shadow-2xl">
            <p className="font-semibold text-white">Loyihani o'chirish</p>
            <p className="mt-2 text-sm text-slate-300">Bu amalni qaytarib bo'lmaydi.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmSlug(null)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">Bekor</button>
              <button type="button" onClick={() => deleteProject(confirmSlug)} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">O'chirish</button>
            </div>
          </div>
        </div>
      ) : null}

      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="PORTFOLIO" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-slate-300">
              {projects.length} ta loyiha
            </span>
            {isAdmin ? (
              <button
                type="button"
                onClick={createProject}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                <Plus className="h-4 w-4" /> Yangi loyiha
              </button>
            ) : null}
          </div>

          <div className="space-y-6">
            {projects.map((project, idx) => (
              <article
                key={project.slug}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition hover:border-white/15"
              >
                <div className={`grid gap-0 ${idx % 2 === 0 ? 'lg:grid-cols-[380px_1fr]' : 'lg:grid-cols-[1fr_380px]'}`}>
                  {/* Cover - left on even, right on odd */}
                  <div className={`relative min-h-[220px] overflow-hidden lg:min-h-0 ${idx % 2 !== 0 ? 'order-2 lg:order-2' : ''}`}>
                    <DynamicMedia
                      src={project.cover}
                      alt={resolveText(project.title, locale)}
                      className="h-full"
                      mediaClassName="h-full min-h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      placeholderTitle={resolveText(project.title, locale)}
                      placeholderHint=""
                    />
                    {/* Year badge overlay */}
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-cyan-300/30 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur">
                        {project.year}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex flex-col justify-between p-6 lg:p-8 ${idx % 2 !== 0 ? 'order-1 lg:order-1' : ''}`}>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400">
                          {common('status')}: {resolveText(project.status, locale)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-white lg:text-3xl">
                          {resolveText(project.title, locale)}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          {resolveText(project.description, locale)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.map(tag => (
                          <span key={tag} className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        {project.metrics.slice(0,3).map((m, i) => (
                          <div key={i} className="rounded-[16px] border border-white/8 bg-slate-950/40 p-3">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">{resolveText(m.label, locale)}</p>
                            <p className="mt-1.5 text-sm font-semibold text-white">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                      >
                        {common('openProject')} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {(project.links ?? []).filter(l => l.href !== '#').slice(0,2).map(l => (
                        <a
                          key={l.id}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin quick-actions */}
                {isAdmin ? (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                    <Link
                      href={`/portfolio/${project.slug}?edit=1`}
                      className="rounded-full border border-cyan-300/20 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur transition hover:bg-cyan-400/10"
                      onClick={e => e.stopPropagation()}
                    >
                      Tahrirlash
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmSlug(project.slug)}
                      className="rounded-full border border-rose-400/20 bg-slate-900/90 p-1.5 text-rose-300 backdrop-blur transition hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {projects.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 py-16 text-center">
              <p className="text-base font-medium text-slate-300">Hali loyiha yo'q</p>
              {isAdmin ? (
                <button type="button" onClick={createProject} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  <Plus className="h-4 w-4" /> Birinchi loyihani qo'shing
                </button>
              ) : null}
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
