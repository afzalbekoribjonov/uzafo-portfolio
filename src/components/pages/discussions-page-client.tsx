'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {ArrowRight, MessageSquareMore, Plus, Search, X} from 'lucide-react';
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

function getRevealProps(reducedMotion: boolean, delay = 0, y = 24) {
  return reducedMotion
    ? {
        initial: {opacity: 1, y: 0},
        whileInView: {opacity: 1, y: 0},
        viewport: {once: true, amount: 0.14},
      }
    : {
        initial: {opacity: 0, y},
        whileInView: {opacity: 1, y: 0},
        viewport: {once: true, amount: 0.14},
        transition: {duration: 0.46, delay, ease: [0.22, 1, 0.36, 1] as const},
      };
}

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: {title: string; category: string; summary: string; content: string}) => Promise<string | null>;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('discussions');
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(locale === 'uz' ? 'General' : 'General');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setErr(t('titleRequired'));
      return;
    }
    if (!summary.trim()) {
      setErr(t('summaryRequired'));
      return;
    }
    if (!stripHtml(content).trim()) {
      setErr(t('contentRequired'));
      return;
    }

    setPending(true);
    const error = await onCreate({
      title: title.trim(),
      category: category.trim() || 'General',
      summary: summary.trim(),
      content,
    });
    setPending(false);

    if (error) {
      setErr(error);
      return;
    }

    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{background: 'var(--overlay-bg)', backdropFilter: 'blur(10px)'}}
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
      animate={{opacity: 1}}
      exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
    >
      <div className="flex min-h-full items-start justify-center p-4 pt-10 sm:pt-16">
        <motion.div
          initial={prefersReducedMotion ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 28, scale: 0.98}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 18, scale: 0.985}}
          transition={{duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1]}}
          className="w-full max-w-3xl overflow-hidden rounded-[32px] border shadow-2xl"
          style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--elevated), var(--surface-1))'}}
        >
          <div className="relative border-b px-5 py-5 sm:px-6" style={{borderColor: 'var(--border-faint)'}}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%)]" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{t('createTitle')}</p>
                <h2 className="text-2xl font-semibold" style={{color: 'var(--text-1)'}}>
                  {t('publish')}
                </h2>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                style={{borderColor: 'var(--border-1)', color: 'var(--text-3)'}}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
                {t('formTitle')}
              </label>
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErr('');
                }}
                className="w-full rounded-[20px] border bg-slate-950/80 px-4 py-3 text-sm outline-none"
                style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                placeholder={t('formTitle')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
                  {t('categoryLabel')}
                </label>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-[20px] border bg-slate-950/80 px-4 py-3 text-sm outline-none"
                  style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                  placeholder={t('categoryPlaceholder')}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
                  {t('summaryLabel')}
                </label>
                <input
                  value={summary}
                  onChange={(event) => {
                    setSummary(event.target.value);
                    setErr('');
                  }}
                  className="w-full rounded-[20px] border bg-slate-950/80 px-4 py-3 text-sm outline-none"
                  style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                  placeholder={t('summaryPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
                {t('contentLabel')}
              </label>
              <RichTextEditor value={content} onChange={setContent} placeholder={t('formContent')} />
            </div>

            {err ? (
              <p
                className="rounded-[20px] border px-4 py-3 text-sm"
                style={{borderColor: 'rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.08)', color: 'var(--danger)'}}
              >
                {err}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="rounded-full border bg-white/5 px-5 py-2.5 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                style={{borderColor: 'var(--border-1)', color: 'var(--text-2)'}}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {pending ? t('submitting') : t('publish')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function DiscussionsPageClient({initialDiscussions}: {initialDiscussions: Discussion[]}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('discussions');
  const router = useRouter();
  const {session, isSignedIn} = useDemoSession();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [discussions, , , replaceDiscussions] = useManagedDiscussions(initialDiscussions);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const ordered = useMemo(() => [...discussions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [discussions]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return ordered.filter((discussion) => {
      const category = resolveText(discussion.category, locale);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesSearch = !query || (
        resolveText(discussion.title, locale).toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        resolveText(discussion.summary, locale).toLowerCase().includes(query)
      );

      return matchesCategory && matchesSearch;
    });
  }, [locale, ordered, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(ordered.map((discussion) => resolveText(discussion.category, locale)).filter(Boolean));
    return Array.from(set);
  }, [ordered, locale]);

  const handleCreate = async (data: {title: string; category: string; summary: string; content: string}) => {
    const baseSlug = slugify(data.title) || `discussion-${Date.now()}`;
    const slug = discussions.find((discussion) => discussion.slug === baseSlug) ? `${baseSlug}-${Date.now()}` : baseSlug;
    const discussion: Discussion = {
      slug,
      ...data,
      createdAt: new Date().toISOString(),
      author: {
        name: session?.name || 'Guest',
        avatar: '/assets/avatars/uzafo-avatar.svg',
        title: session?.role === 'admin' ? 'Admin' : 'Member',
      },
      messages: [],
    };

    try {
      const created = await createDiscussionApi(discussion);
      replaceDiscussions((current) => [created, ...current]);
      router.push(`/discussions/${created.slug}`);
      return null;
    } catch (error) {
      console.error('Failed to create discussion.', error);
      return t('createError');
    }
  };

  return (
    <>
      <AnimatePresence>{showCreate ? <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} /> : null}</AnimatePresence>

      <PageHero
        title={t('title')}
        subtitle={t('subtitle')}
        eyebrow={t('eyebrow')}
        actions={
          isSignedIn ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
            >
              <Plus className="h-4 w-4" />
              {t('newDiscussion')}
            </button>
          ) : (
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}
            >
              {t('signInToCreate')}
            </Link>
          )
        }
      />

      <section className="py-12 sm:py-16">
        <Container className="space-y-6 sm:space-y-8">
          <motion.div
            {...getRevealProps(prefersReducedMotion, 0.02)}
            className="rounded-[30px] border p-4 sm:p-5"
            style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--surface-1), var(--elevated))'}}
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{color: 'var(--text-4)'}} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-full border bg-slate-950/80 py-3 pl-11 pr-4 text-sm outline-none"
                  style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                />
              </div>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <span
                  className="inline-flex items-center rounded-full border px-3.5 py-2 text-sm"
                  style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}
                >
                  {t('topicsCount', {count: filtered.length})}
                </span>
              </div>
            </div>

            {categories.length > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium transition"
                  style={selectedCategory === 'all'
                    ? {borderColor: 'rgba(8,145,178,0.32)', background: 'var(--accent-m)', color: 'var(--accent)'}
                    : {borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-3)'}}
                >
                  {t('allCategories')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium transition"
                    style={selectedCategory === category
                      ? {borderColor: 'rgba(8,145,178,0.32)', background: 'var(--accent-m)', color: 'var(--accent)'}
                      : {borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-3)'}}
                  >
                    {category}
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>

          {filtered.length === 0 ? (
            <motion.div
              {...getRevealProps(prefersReducedMotion, 0.06, 18)}
              className="rounded-[30px] border border-dashed px-6 py-16 text-center"
              style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                <MessageSquareMore className="h-7 w-7" />
              </div>
              <p className="mt-5 text-lg font-semibold" style={{color: 'var(--text-1)'}}>
                {searchTerm || selectedCategory !== 'all' ? t('noResults') : t('noDiscussions')}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7" style={{color: 'var(--text-3)'}}>
                {t('emptyHint')}
              </p>
              {isSignedIn && !searchTerm && selectedCategory === 'all' ? (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <Plus className="h-4 w-4" />
                  {t('firstDiscussion')}
                </button>
              ) : null}
            </motion.div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((discussion, index) => (
                <motion.div
                  key={discussion.slug}
                  {...getRevealProps(prefersReducedMotion, 0.05 + index * 0.04)}
                  whileHover={prefersReducedMotion ? undefined : {y: -4}}
                  transition={prefersReducedMotion ? undefined : {duration: 0.22, ease: 'easeOut'}}
                >
                  <Link
                    href={`/discussions/${discussion.slug}`}
                    className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border p-5 sm:p-6"
                    style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--surface-1), var(--elevated))'}}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%)] opacity-80 transition duration-300 group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                            style={{borderColor: 'rgba(8,145,178,0.22)', background: 'var(--accent-m)', color: 'var(--accent)'}}
                          >
                            {resolveText(discussion.category, locale)}
                          </span>
                          <span
                            className="rounded-full border px-3 py-1 text-[11px]"
                            style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-3)'}}
                          >
                            {t('repliesCount', {count: discussion.messages.length})}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs" style={{color: 'var(--text-4)'}}>
                          {formatDateTime(discussion.createdAt, locale)}
                        </span>
                      </div>

                      <h3 className="mt-5 line-clamp-2 text-xl font-semibold tracking-tight transition group-hover:text-cyan-200" style={{color: 'var(--text-1)'}}>
                        {resolveText(discussion.title, locale)}
                      </h3>
                      <p className="mt-3 flex-1 line-clamp-3 text-sm leading-7" style={{color: 'var(--text-3)'}}>
                        {resolveText(discussion.summary, locale)}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{borderColor: 'var(--border-faint)'}}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                            {discussion.author.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" style={{color: 'var(--text-1)'}}>
                              {discussion.author.name}
                            </p>
                            <p className="truncate text-xs" style={{color: 'var(--text-4)'}}>
                              {resolveText(discussion.author.title, locale)}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300">
                          {t('openDiscussion')}
                          <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
