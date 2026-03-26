'use client';

import {MessageSquareMore, Plus, Search, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/navigation';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {RichTextEditor} from '@/components/editor/rich-text-editor';
import {useDemoSession} from '@/lib/auth';
import {createDiscussion as createDiscussionApi} from '@/lib/api-service';
import {useManagedDiscussions} from '@/lib/demo-store';
import type {Discussion, Locale} from '@/lib/types';
import {formatDateTime, resolveText, slugify} from '@/lib/utils';

function CreateModal({onClose, onCreate}: {
  onClose: () => void;
  onCreate: (d: {title:string; category:string; summary:string; content:string}) => void;
}) {
  const t = useTranslations('discussions');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!title.trim()) { setErr('Sarlavha majburiy'); return; }
    if (!summary.trim()) { setErr('Qisqacha tavsif majburiy'); return; }
    onCreate({title: title.trim(), category: category.trim() || 'General', summary: summary.trim(), content});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)'}}>
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl" style={{background:'var(--elevated)'}}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{t('createTitle')}</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{t('publish')}</h2>
            </div>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Sarlavha *</label>
              <input value={title} onChange={e => {setTitle(e.target.value); setErr('');}}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                placeholder={t('formTitle')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Kategoriya</label>
                <input value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Frontend, AI, General..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Qisqacha tavsif *</label>
                <input value={summary} onChange={e => {setSummary(e.target.value); setErr('');}}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Muammoni bir jumlada yozing" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Kontent</label>
              <RichTextEditor value={content} onChange={setContent} placeholder={t('formContent')} />
            </div>
            {err && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{err}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10">Bekor</button>
              <button type="button" onClick={submit} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                <Plus className="h-4 w-4" /> {t('publish')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiscussionsPageClient({initialDiscussions}: {initialDiscussions: Discussion[]}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('discussions');
  const router = useRouter();
  const {session, isSignedIn} = useDemoSession();
  const [discussions, setDiscussions] = useManagedDiscussions(initialDiscussions);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const ordered = useMemo(() => [...discussions].sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [discussions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ordered;
    const q = search.toLowerCase();
    return ordered.filter(d =>
      resolveText(d.title, locale).toLowerCase().includes(q) ||
      resolveText(d.category, locale).toLowerCase().includes(q) ||
      resolveText(d.summary, locale).toLowerCase().includes(q)
    );
  }, [ordered, search, locale]);

  const categories = useMemo(() => {
    const set = new Set(ordered.map(d => resolveText(d.category, locale)));
    return Array.from(set);
  }, [ordered, locale]);

  const handleCreate = async (data: {title:string; category:string; summary:string; content:string}) => {
    const baseSlug = slugify(data.title) || `discussion-${Date.now()}`;
    const slug = discussions.find(d => d.slug === baseSlug) ? `${baseSlug}-${Date.now()}` : baseSlug;
    const d: Discussion = {
      slug, ...data,
      createdAt: new Date().toISOString(),
      author: {name: session?.name || 'Guest', avatar: '/assets/avatars/uzafo-avatar.svg', title: session?.role === 'admin' ? 'Admin' : 'Member'},
      messages: []
    };
    try {
      const created = await createDiscussionApi(d);
      setDiscussions([created, ...ordered]);
      router.push(`/discussions/${created.slug}`);
      return;
    } catch {}
    setDiscussions([d, ...ordered]);
    router.push(`/discussions/${d.slug}`);
  };

  return (
    <>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="DISCUSSION" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-8">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300">
              {filtered.length} ta mavzu
            </span>
            {isSignedIn ? (
              <button type="button" onClick={() => setShowCreate(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
                <Plus className="h-4 w-4" /> Yangi muhokama
              </button>
            ) : (
              <Link href="/auth/sign-in"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10">
                Muhokama yaratish uchun kiring
              </Link>
            )}
          </div>

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSearch('')}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${!search ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/8'}`}>
                Barchasi
              </button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setSearch(cat)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${search === cat ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/8'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 py-16 text-center">
              <MessageSquareMore className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-4 text-base font-medium text-slate-300">
                {search ? 'Natija topilmadi' : 'Hali muhokama yo\'q'}
              </p>
              {isSignedIn && !search && (
                <button type="button" onClick={() => setShowCreate(true)}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  <Plus className="h-4 w-4" /> Birinchi muhokamani yarating
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map(d => (
                <Link key={d.slug} href={`/discussions/${d.slug}`}
                  className="group flex flex-col rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:shadow-[0_4px_20px_rgba(34,211,238,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                      {resolveText(d.category, locale)}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatDateTime(d.createdAt, locale)}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white transition group-hover:text-cyan-200 line-clamp-2">
                    {resolveText(d.title, locale)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-400 line-clamp-2">
                    {resolveText(d.summary, locale)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-300">
                        {d.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-400">{d.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MessageSquareMore className="h-3.5 w-3.5" /> {d.messages.length} javob
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
