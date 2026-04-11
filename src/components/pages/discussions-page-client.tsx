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
import {formatDateTime, resolveText, slugify, stripHtml} from '@/lib/utils';

function CreateModal({onClose, onCreate}: {
  onClose: () => void;
  onCreate: (d: {title:string; category:string; summary:string; content:string}) => Promise<string | null>;
}) {
  const t = useTranslations('discussions');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!title.trim()) { setErr('Sarlavha majburiy'); return; }
    if (!summary.trim()) { setErr('Qisqacha tavsif majburiy'); return; }
    if (!stripHtml(content).trim()) { setErr('Kontent majburiy'); return; }

    setPending(true);
    const error = await onCreate({title: title.trim(), category: category.trim() || 'General', summary: summary.trim(), content});
    setPending(false);
    if (error) {
      setErr(error);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)'}}>
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="max-h-[calc(100vh-5rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6" style={{background:'var(--elevated)'}}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{t('createTitle')}</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{t('publish')}</h2>
            </div>
            <button type="button" disabled={pending} onClick={onClose} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
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
            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button type="button" disabled={pending} onClick={onClose} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">Bekor</button>
              <button type="button" disabled={pending} onClick={submit} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
                <Plus className="h-4 w-4" /> {pending ? 'Yuborilmoqda...' : t('publish')}
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
  const common = useTranslations('common');
  const router = useRouter();
  const {session, isSignedIn} = useDemoSession();
  const [discussions, , , replaceDiscussions] = useManagedDiscussions(initialDiscussions);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const ordered = useMemo(() => [...discussions].sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [discussions]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return ordered.filter((discussion) => {
      const category = resolveText(discussion.category, locale);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesSearch = !q || (
        resolveText(discussion.title, locale).toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        resolveText(discussion.summary, locale).toLowerCase().includes(q)
      );

      return matchesCategory && matchesSearch;
    });
  }, [locale, ordered, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(ordered.map(d => resolveText(d.category, locale)).filter(Boolean));
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
      replaceDiscussions((current) => [created, ...current]);
      router.push(`/discussions/${created.slug}`);
      return null;
    } catch (error) {
      console.error('Failed to create discussion.', error);
      return 'Muhokamani yaratishda xatolik yuz berdi. Qayta urinib ko‘ring.';
    }
  };

  return (
    <>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="DISCUSSION" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-8">
          {/* Toolbar */}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative min-w-0 md:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`${common('search')}...`}
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
            </div>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 md:justify-center">
              {filtered.length} ta mavzu
            </span>
            {isSignedIn ? (
              <button type="button" onClick={() => setShowCreate(true)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 md:w-auto">
                <Plus className="h-4 w-4" /> Yangi muhokama
              </button>
            ) : (
              <Link href="/auth/sign-in"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-slate-300 transition hover:bg-white/10 md:w-auto">
                Muhokama yaratish uchun kiring
              </Link>
            )}
          </div>

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setSelectedCategory('all')}
                className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${selectedCategory === 'all' ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/8'}`}>
                Barchasi
              </button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${selectedCategory === cat ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/8'}`}>
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
                {searchTerm || selectedCategory !== 'all' ? 'Natija topilmadi' : 'Hali muhokama yo\'q'}
              </p>
              {isSignedIn && !searchTerm && selectedCategory === 'all' && (
                <button type="button" onClick={() => setShowCreate(true)}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  <Plus className="h-4 w-4" /> Birinchi muhokamani yarating
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map(d => (
                <Link key={d.slug} href={`/discussions/${d.slug}`}
                  className="group flex min-w-0 flex-col rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:shadow-[0_4px_20px_rgba(34,211,238,0.06)]">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                      {resolveText(d.category, locale)}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-slate-500">{formatDateTime(d.createdAt, locale)}</span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-semibold text-white transition group-hover:text-cyan-200">
                    {resolveText(d.title, locale)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-400 line-clamp-3">
                    {resolveText(d.summary, locale)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-300">
                        {d.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-xs text-slate-400">{d.author.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
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
