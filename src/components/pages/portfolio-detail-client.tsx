'use client';

import {AlertTriangle, ArrowLeft, ExternalLink, Plus, Trash2, Upload, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {BlogContentRenderer} from '@/components/blog/blog-content-renderer';
import {ContentBlockEditor} from '@/components/editor/content-block-editor';
import {getPortfolioLinkCaption, hasStandalonePortfolioContent, isPublicPortfolioProject, isUsablePortfolioLink, isUsablePortfolioMetric, isUsablePortfolioTag, normalizePortfolioHref} from '@/components/pages/portfolio-project-helpers';
import {DynamicMedia, MediaTypeBadge, isVideoSource} from '@/components/ui/dynamic-media';
import {ImageEditor} from '@/components/ui/image-editor';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {deleteProject as deleteProjectApi} from '@/lib/api-service';
import {useManagedProjects} from '@/lib/demo-store';
import {uploadMediaSource} from '@/lib/imagekit';
import type {Locale, Project, ProjectMetric} from '@/lib/types';
import {makeId, normalizeProject, resolveText} from '@/lib/utils';


function ConfirmDialog({message, onConfirm, onCancel}: {message: string; onConfirm: () => void; onCancel: () => void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] border border-rose-400/20 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Loyihani o&apos;chirish</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            <X className="h-4 w-4" /> Bekor qilish
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
            <Trash2 className="h-4 w-4" /> Ha, o&apos;chirish
          </button>
        </div>
      </div>
    </div>
  );
}

function isRoleMetric(metric: ProjectMetric, locale: Locale) {
  const label = resolveText(metric.label, locale).trim().toLowerCase();
  return label === 'role' || label === 'rol' || label.includes('role') || label.includes('rol');
}

export function PortfolioDetailClient({initialProjects, slug}: {initialProjects: Project[]; slug: string}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('portfolio');
  const common = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const {isAdmin} = useDemoSession();
  const [projects, setProjects, , replaceProjects] = useManagedProjects(initialProjects);
  const project = useMemo(() => {
    const base = projects.find((item) => item.slug === slug) ?? initialProjects.find((item) => item.slug === slug) ?? null;
    if (!base) return null;

    const normalized = normalizeProject(base);
    return !isAdmin && !isPublicPortfolioProject(normalized) ? null : normalized;
  }, [initialProjects, isAdmin, projects, slug]);
  const [draft, setDraft] = useState<Project | null>(project);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCover, setEditingCover] = useState(false);

  useEffect(() => {
    setDraft(project);
    setEditingCover(false);
  }, [project]);
  useEffect(() => { if (isAdmin && searchParams.get('edit') === '1') setEditing(true); }, [isAdmin, searchParams]);

  if (!project || !draft) {
    return (
      <section className="py-20">
        <Container>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            Loyiha topilmadi.{' '}
            <Link href="/portfolio" className="text-cyan-300 hover:text-cyan-200">Portfolio sahifasiga qaytish</Link>
          </div>
        </Container>
      </section>
    );
  }

  const saveDraft = () => {
    const next = normalizeProject(draft);
    setProjects(projects.map((item) => item.slug === slug ? next : item));
    setEditing(false);
  };

  const cancelDraft = () => {
    setDraft(project);
    setEditing(false);
    setEditingCover(false);
  };
  const deleteProject = async () => {
    try {
      await deleteProjectApi(slug);
      replaceProjects((current) => current.filter((item) => item.slug !== slug));
      router.push('/portfolio');
    } catch (error) {
      console.error(`Failed to delete project ${slug}.`, error);
    }
  };
  const displayed = editing ? draft : project;
  const visibleTags = editing ? displayed.tags : displayed.tags.filter(isUsablePortfolioTag);
  const visibleMetrics = editing ? displayed.metrics : displayed.metrics.filter(isUsablePortfolioMetric);
  const visibleLinks = editing ? (displayed.links || []) : (displayed.links || []).filter(isUsablePortfolioLink);
  const titleText = resolveText(displayed.title, locale);
  const excerptText = resolveText(displayed.excerpt, locale).trim();
  const descriptionText = resolveText(displayed.description, locale).trim();
  const leadText = excerptText || descriptionText;
  const hasStandaloneContent = editing ? true : hasStandalonePortfolioContent(displayed, locale);
  const showOverview = !editing && !hasStandaloneContent && descriptionText.length > 0 && descriptionText !== leadText;
  const roleMetric = !editing ? visibleMetrics.find((metric) => isRoleMetric(metric, locale)) ?? null : null;
  const summaryMetrics = !editing && roleMetric ? visibleMetrics.filter((metric) => metric !== roleMetric) : visibleMetrics;
  const hasSummaryAside = editing || Boolean(roleMetric) || summaryMetrics.length > 0 || visibleTags.length > 0 || visibleLinks.length > 0;

  return (
    <>
      {showDeleteConfirm ? (
        <ConfirmDialog
          message={`"${resolveText(project.title, locale)}" loyihasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
          onConfirm={deleteProject}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}
      {editing ? <PageHero title={titleText} subtitle={excerptText} /> : null}
      <section className="py-16 sm:py-20">
        <Container className="space-y-6">
          {isAdmin ? <AdminInlineBar editing={editing} onToggle={() => setEditing((v) => !v)} onSave={saveDraft} onCancel={cancelDraft} onDelete={() => setShowDeleteConfirm(true)} /> : null}
          <Link href="/portfolio" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"><ArrowLeft className="h-4 w-4" /> {t('title')}</Link>

          {editing ? (
            <>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">Project cover</p>
                      <p className="text-xs text-slate-400">Use an image or video, or leave the project without cover media.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draft.cover && !isVideoSource(draft.cover) && !editingCover ? (
                        <button type="button" onClick={() => setEditingCover(true)} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300 transition hover:bg-cyan-400/20">
                          Tahrirlash
                        </button>
                      ) : null}
                      <button type="button" onClick={() => { setDraft({...draft, cover: ''}); setEditingCover(false); }} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                        <Upload className="h-4 w-4" /> Upload
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                          const input = e.currentTarget;
                          const file = input.files?.[0];
                          if (!file) return;
                          try {
                            const media = await uploadMediaSource(file, {ownerType: 'project', ownerSlug: slug, role: 'cover'});
                            setDraft({...draft, cover: media.url});
                            setEditingCover(false);
                          } finally {
                            input.value = '';
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                  {editingCover && draft.cover && !isVideoSource(draft.cover) ? (
                    <ImageEditor
                      key={draft.cover}
                      src={draft.cover}
                      onSave={async (dataUrl) => {
                        const media = await uploadMediaSource(dataUrl, {ownerType: 'project', ownerSlug: slug, role: 'cover'});
                        setDraft({...draft, cover: media.url});
                        setEditingCover(false);
                      }}
                      onCancel={() => setEditingCover(false)}
                    />
                  ) : (
                    <>
                      <MediaTypeBadge src={draft.cover} />
                      <DynamicMedia
                        src={displayed.cover}
                        alt={titleText}
                        className="aspect-[16/10] rounded-[32px] border border-white/10 bg-slate-950/70"
                        mediaClassName="h-full w-full object-cover"
                        placeholderTitle="No project cover yet"
                        placeholderHint="This project can stay media-free until you add an image or video."
                      />
                      <input value={draft.cover} onChange={(e) => { setDraft({...draft, cover: e.target.value}); setEditingCover(false); }} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Cover URL" />
                    </>
                  )}
                </div>

                <div className="min-w-0 space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
                  <div className="grid gap-4">
                    <input value={titleText} onChange={(e) => setDraft({...draft, title: e.target.value})} className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-5 py-4 text-3xl font-semibold text-white outline-none" />
                    <textarea value={excerptText} onChange={(e) => setDraft({...draft, excerpt: e.target.value})} className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                    <textarea value={descriptionText} onChange={(e) => setDraft({...draft, description: e.target.value})} className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={draft.year} onChange={(e) => setDraft({...draft, year: e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Year" />
                      <input value={resolveText(draft.status, locale)} onChange={(e) => setDraft({...draft, status: e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Status" />
                    </div>
                  </div>

                  {visibleTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayed.tags.map((tag, index) => (
                        <div key={`${tag}-${index}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5">
                          <input value={tag} onChange={(e) => setDraft({...draft, tags: draft.tags.map((item, i) => i === index ? e.target.value : item)})} className="min-w-0 bg-transparent text-xs text-slate-200 outline-none" />
                          <button type="button" onClick={() => setDraft({...draft, tags: draft.tags.filter((_, i) => i !== index)})} className="inline-flex cursor-pointer items-center text-rose-200 transition hover:text-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setDraft({...draft, tags: [...draft.tags, 'NewTag']})} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Tag</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setDraft({...draft, tags: [...draft.tags, 'NewTag']})} className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Tag</button>
                  )}

                  {visibleMetrics.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {displayed.metrics.map((metric, index) => (
                        <div key={`${metric.value}-${index}`} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                          <div className="grid gap-2">
                            <input value={resolveText(metric.label, locale)} onChange={(e) => setDraft({...draft, metrics: draft.metrics.map((item, i) => i === index ? {...item, label: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none" />
                            <input value={metric.value} onChange={(e) => setDraft({...draft, metrics: draft.metrics.map((item, i) => i === index ? {...item, value: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">{t('projectLinks')}</h3>
                    <div className="grid gap-3">
                      {visibleLinks.map((linkItem, index) => (
                        <div key={linkItem.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm sm:items-center">
                          <div className="grid w-full gap-2 md:grid-cols-[0.35fr_0.65fr_auto]">
                            <input value={linkItem.label} onChange={(e) => setDraft({...draft, links: (draft.links || []).map((item, i) => i === index ? {...item, label: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                            <input value={linkItem.href} onChange={(e) => setDraft({...draft, links: (draft.links || []).map((item, i) => i === index ? {...item, href: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                            <button type="button" onClick={() => setDraft({...draft, links: (draft.links || []).filter((_, i) => i !== index)})} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setDraft({...draft, links: [...(draft.links || []), {id: makeId('link'), label: 'New link', href: '#'}]})} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"><Plus className="h-4 w-4" /> Add link</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
                <ContentBlockEditor blocks={draft.content || []} onChange={(content) => setDraft({...draft, content})} locale={locale} uploadContext={{ownerType: 'project', ownerSlug: slug}} />
              </div>
            </>
          ) : (
            <div className={`grid items-start gap-6 ${hasSummaryAside ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
              <div className="min-w-0 space-y-6">
                <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/5">
                  <div className="space-y-6 p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{project.year}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{common('status')}: {resolveText(project.status, locale)}</span>
                    </div>
                    <div className="max-w-4xl space-y-4">
                      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-[2.8rem] xl:leading-[1.05]">{titleText}</h1>
                      {leadText ? <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{leadText}</p> : null}
                    </div>
                  </div>
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
                    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70 shadow-[0_20px_80px_rgba(15,23,42,0.28)]">
                      <DynamicMedia
                        src={displayed.cover}
                        alt={titleText}
                        className="aspect-[16/10] sm:aspect-[16/9] xl:aspect-[16/10]"
                        mediaClassName="h-full w-full object-cover"
                        placeholderTitle={titleText}
                        placeholderHint=""
                      />
                    </div>
                  </div>
                </div>

                {showOverview ? (
                  <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t('overview')}</p>
                    <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{descriptionText}</p>
                  </div>
                ) : null}

                {hasStandaloneContent ? (
                  <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
                    <BlogContentRenderer blocks={displayed.content || []} />
                  </div>
                ) : null}
              </div>

              {hasSummaryAside ? (
                <aside className="min-w-0 xl:sticky xl:top-24">
                  <div className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
                    {roleMetric ? (
                      <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-400/10 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{resolveText(roleMetric.label, locale)}</p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{roleMetric.value}</p>
                      </div>
                    ) : null}

                    {summaryMetrics.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t('projectMetrics')}</p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          {summaryMetrics.map((metric, index) => (
                            <div key={`${metric.value}-${index}`} className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{resolveText(metric.label, locale)}</p>
                              <p className="mt-2 text-base font-semibold text-white">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {visibleTags.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t('techStack')}</p>
                        <div className="flex flex-wrap gap-2">
                          {visibleTags.map((tag) => (
                            <span key={tag} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {visibleLinks.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t('projectLinks')}</p>
                        <div className="grid gap-3">
                          {visibleLinks.map((linkItem) => (
                            <a
                              key={linkItem.id}
                              href={normalizePortfolioHref(linkItem.href)}
                              target="_blank"
                              rel="noreferrer"
                              className="group inline-flex min-w-0 items-center justify-between gap-3 rounded-[22px] border px-4 py-3.5 text-sm transition hover:-translate-y-0.5"
                              style={{borderColor: 'var(--border-1)', background: 'var(--surface-2)', color: 'var(--text-2)'}}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium" style={{color: 'var(--text-1)'}}>{linkItem.label}</p>
                                <p className="mt-1 truncate text-xs" style={{color: 'var(--text-4)'}}>{getPortfolioLinkCaption(linkItem.href)}</p>
                              </div>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition" style={{background: 'var(--accent-m)', color: 'var(--accent)'}}>
                                <ExternalLink className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </aside>
              ) : null}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
