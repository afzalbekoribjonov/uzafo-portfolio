'use client';

import {AlertTriangle, ArrowLeft, ExternalLink, Plus, Trash2, Upload, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {BlogContentRenderer} from '@/components/blog/blog-content-renderer';
import {ContentBlockEditor} from '@/components/editor/content-block-editor';
import {DynamicMedia, MediaTypeBadge} from '@/components/ui/dynamic-media';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {deleteProject as deleteProjectApi} from '@/lib/api-service';
import {useManagedProjects} from '@/lib/demo-store';
import {uploadMediaSource} from '@/lib/imagekit';
import type {Locale, Project} from '@/lib/types';
import {makeId, normalizeProject, resolveText} from '@/lib/utils';


function ConfirmDialog({message, onConfirm, onCancel}: {message: string; onConfirm: () => void; onCancel: () => void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] border border-rose-400/20 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Loyihani o'chirish</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            <X className="h-4 w-4" /> Bekor qilish
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
            <Trash2 className="h-4 w-4" /> Ha, o'chirish
          </button>
        </div>
      </div>
    </div>
  );
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
    return base ? normalizeProject(base) : null;
  }, [initialProjects, projects, slug]);
  const [draft, setDraft] = useState<Project | null>(project);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => setDraft(project), [project]);
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

  const cancelDraft = () => { setDraft(project); setEditing(false); };
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

  return (
    <>
      {showDeleteConfirm ? (
        <ConfirmDialog
          message={`"${resolveText(project.title, locale)}" loyihasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
          onConfirm={deleteProject}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}
      <PageHero eyebrow="PROJECT" title={resolveText(displayed.title, locale)} subtitle={resolveText(displayed.excerpt, locale)} />
      <section className="py-16 sm:py-20">
        <Container className="space-y-6">
          {isAdmin ? <AdminInlineBar editing={editing} onToggle={() => setEditing((v) => !v)} onSave={saveDraft} onCancel={cancelDraft} onDelete={() => setShowDeleteConfirm(true)} /> : null}
          <Link href="/portfolio" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"><ArrowLeft className="h-4 w-4" /> {t('title')}</Link>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">Project cover</p>
                  <p className="text-xs text-slate-400">Use an image or video, or leave the project without cover media.</p>
                </div>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setDraft({...draft, cover: ''})} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                      <Upload className="h-4 w-4" /> Upload
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        try {
                          const media = await uploadMediaSource(file, {ownerType: 'project', ownerSlug: slug, role: 'cover'});
                          setDraft({...draft, cover: media.url});
                        } finally {
                          input.value = '';
                        }
                      }} />
                    </label>
                  </div>
                ) : <MediaTypeBadge src={displayed.cover} />}
              </div>
              <DynamicMedia src={displayed.cover} alt={resolveText(displayed.title, locale)} className="rounded-[32px] border border-white/10 bg-slate-950/70" placeholderTitle="No project cover yet" placeholderHint="This project can stay media-free until you add an image or video." />
              {editing ? <input value={draft.cover} onChange={(e) => setDraft({...draft, cover: e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Cover URL" /> : null}
            </div>

            <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6">
              {editing ? (
                <div className="grid gap-4">
                  <input value={resolveText(draft.title, locale)} onChange={(e) => setDraft({...draft, title: e.target.value})} className="w-full rounded-[22px] border border-white/10 bg-slate-950/80 px-5 py-4 text-3xl font-semibold text-white outline-none" />
                  <textarea value={resolveText(draft.excerpt, locale)} onChange={(e) => setDraft({...draft, excerpt: e.target.value})} className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                  <textarea value={resolveText(draft.description, locale)} onChange={(e) => setDraft({...draft, description: e.target.value})} className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={draft.year} onChange={(e) => setDraft({...draft, year: e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Year" />
                    <input value={resolveText(draft.status, locale)} onChange={(e) => setDraft({...draft, status: e.target.value})} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Status" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{project.year}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{common('status')}: {resolveText(project.status, locale)}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold text-white">{resolveText(project.title, locale)}</h2>
                    <p className="mt-4 text-sm leading-8 text-slate-300">{resolveText(project.description, locale)}</p>
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-2">
                {(displayed.tags || []).map((tag, index) => editing ? (
                  <div key={`${tag}-${index}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5">
                    <input value={tag} onChange={(e) => setDraft({...draft, tags: draft.tags.map((item, i) => i === index ? e.target.value : item)})} className="min-w-0 bg-transparent text-xs text-slate-200 outline-none" />
                    <button type="button" onClick={() => setDraft({...draft, tags: draft.tags.filter((_, i) => i !== index)})} className="inline-flex cursor-pointer items-center text-rose-200 transition hover:text-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ) : <span key={tag} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">{tag}</span>)}
                {editing ? <button type="button" onClick={() => setDraft({...draft, tags: [...draft.tags, 'NewTag']})} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Tag</button> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {displayed.metrics.map((metric, index) => (
                  <div key={`${metric.value}-${index}`} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                    {editing ? (
                      <div className="grid gap-2">
                        <input value={resolveText(metric.label, locale)} onChange={(e) => setDraft({...draft, metrics: draft.metrics.map((item, i) => i === index ? {...item, label: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none" />
                        <input value={metric.value} onChange={(e) => setDraft({...draft, metrics: draft.metrics.map((item, i) => i === index ? {...item, value: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                      </div>
                    ) : (
                      <>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{resolveText(metric.label, locale)}</p>
                        <p className="mt-3 text-base font-semibold text-white">{metric.value}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Project links</h3>
                <div className="grid gap-3">
                  {(displayed.links || []).map((linkItem, index) => (
                    <div key={linkItem.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm">
                      {editing ? (
                        <div className="grid w-full gap-2 md:grid-cols-[0.35fr_0.65fr_auto]">
                          <input value={linkItem.label} onChange={(e) => setDraft({...draft, links: (draft.links || []).map((item, i) => i === index ? {...item, label: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                          <input value={linkItem.href} onChange={(e) => setDraft({...draft, links: (draft.links || []).map((item, i) => i === index ? {...item, href: e.target.value} : item)})} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                          <button type="button" onClick={() => setDraft({...draft, links: (draft.links || []).filter((_, i) => i !== index)})} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                        </div>
                      ) : (
                        <a href={linkItem.href} className="inline-flex items-center gap-2 text-white transition hover:text-cyan-200"><ExternalLink className="h-4 w-4 text-cyan-300" /> {linkItem.label}</a>
                      )}
                    </div>
                  ))}
                </div>
                {editing ? <button type="button" onClick={() => setDraft({...draft, links: [...(draft.links || []), {id: makeId('link'), label: 'New link', href: '#'}]})} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"><Plus className="h-4 w-4" /> Add link</button> : null}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            {editing ? <ContentBlockEditor blocks={draft.content || []} onChange={(content) => setDraft({...draft, content})} locale={locale} uploadContext={{ownerType: 'project', ownerSlug: slug}} /> : <BlogContentRenderer blocks={project.content || []} />}
          </div>
        </Container>
      </section>
    </>
  );
}
