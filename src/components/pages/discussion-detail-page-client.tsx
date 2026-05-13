'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  MessageSquareText,
  PencilLine,
  SendHorizontal,
  Trash2,
  User2,
  X,
} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {DiscussionRichContent} from '@/components/discussions/discussion-rich-content';
import {RichTextEditor} from '@/components/editor/rich-text-editor';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {addReply as addReplyApi, deleteDiscussion as deleteDiscussionApi, deleteReply as deleteReplyApi} from '@/lib/api-service';
import {useManagedDiscussions} from '@/lib/demo-store';
import type {Discussion, Locale, TextValue} from '@/lib/types';
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

function updateTextValue(value: TextValue, locale: Locale, next: string): TextValue {
  if (typeof value === 'string') {
    return locale === 'uz'
      ? {uz: next, en: value}
      : {uz: value, en: next};
  }

  return {...value, [locale]: next};
}

function Confirm({
  message,
  confirmLabel,
  cancelLabel,
  onOk,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background: 'var(--overlay-bg)', backdropFilter: 'blur(10px)'}}
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
      animate={{opacity: 1}}
      exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
    >
      <motion.div
        initial={prefersReducedMotion ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 18, scale: 0.98}}
        animate={{opacity: 1, y: 0, scale: 1}}
        exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 16, scale: 0.985}}
        transition={{duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1]}}
        className="w-full max-w-md rounded-[28px] border p-6 shadow-2xl"
        style={{borderColor: 'rgba(244,63,94,0.2)', background: 'linear-gradient(180deg, var(--elevated), var(--surface-1))'}}
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <p className="text-base font-semibold" style={{color: 'var(--text-1)'}}>
              {confirmLabel}
            </p>
            <p className="text-sm leading-6" style={{color: 'var(--text-3)'}}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-full border bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10"
            style={{borderColor: 'var(--border-1)', color: 'var(--text-2)'}}
          >
            <X className="h-4 w-4" />
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onOk}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DiscussionDetailPageClient({initialDiscussions, slug}: {initialDiscussions: Discussion[]; slug: string}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('discussions');
  const common = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const {isAdmin, session, isSignedIn} = useDemoSession();
  const [discussions, , , replaceDiscussions] = useManagedDiscussions(initialDiscussions);
  const [reply, setReply] = useState('<p></p>');
  const [guestName, setGuestName] = useState('');
  const [editingOverride, setEditingOverride] = useState<boolean | null>(null);
  const [confirmDisc, setConfirmDisc] = useState(false);
  const [confirmReplyId, setConfirmReplyId] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<Discussion | null>(null);

  const discussion = useMemo(
    () => discussions.find((item) => item.slug === slug) ?? initialDiscussions.find((item) => item.slug === slug) ?? null,
    [discussions, initialDiscussions, slug]
  );

  const editing = editingOverride ?? (isAdmin && searchParams.get('edit') === '1');

  if (!discussion) {
    return (
      <section className="py-20">
        <Container>
          <div
            className="rounded-[30px] border px-6 py-12 text-center"
            style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--surface-1), var(--elevated))'}}
          >
            <p className="text-lg font-semibold" style={{color: 'var(--text-1)'}}>
              {t('notFound')}
            </p>
            <Link href="/discussions" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
              <ArrowLeft className="h-4 w-4" />
              {t('backToDiscussions')}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const draft = draftState ?? discussion;
  const displayed = editing ? draft : discussion;

  const beginEditing = () => {
    setDraftState(discussion);
    setEditingOverride(true);
  };

  const stopEditing = () => {
    setDraftState(null);
    setEditingOverride(false);
  };

  const toggleEditing = () => {
    if (editing) {
      stopEditing();
      return;
    }
    beginEditing();
  };

  const saveDraft = () => {
    const nextSlug = slugify(resolveText(draft.title, locale)) || draft.slug;
    const safeSlug = discussions.some((item) => item.slug === nextSlug && item.slug !== slug) ? draft.slug : nextSlug;

    replaceDiscussions((current) =>
      current.map((item) => item.slug === slug ? {...draft, slug: safeSlug} : item)
    );
    stopEditing();

    if (safeSlug !== slug) {
      router.push(`/discussions/${safeSlug}`);
    }
  };

  const updateDraft = (updater: (current: Discussion) => Discussion) => {
    setDraftState((current) => current ? updater(current) : current);
  };

  const deleteDiscussion = async () => {
    try {
      await deleteDiscussionApi(slug);
      replaceDiscussions((current) => current.filter((item) => item.slug !== slug));
      router.push('/discussions');
    } catch (error) {
      console.error(`Failed to delete discussion ${slug}.`, error);
    }
  };

  const removeReply = async (id: string) => {
    try {
      await deleteReplyApi(slug, id);
      replaceDiscussions((current) => current.map((item) => item.slug === slug ? {
        ...item,
        messages: item.messages.filter((message) => message.id !== id),
      } : item));
      setConfirmReplyId(null);
    } catch (error) {
      console.error(`Failed to delete reply ${id} on ${slug}.`, error);
    }
  };

  const submitReply = async () => {
    if (!stripHtml(reply).trim()) return;
    if (!isSignedIn && !guestName.trim()) return;

    try {
      const updated = await addReplyApi(slug, {
        text: reply,
        authorName: isSignedIn ? undefined : guestName.trim()
      });
      replaceDiscussions((current) => current.map((item) => item.slug === slug ? updated : item));
      setReply('<p></p>');
      setGuestName('');
    } catch (error) {
      console.error(`Failed to add reply to discussion ${slug}.`, error);
    }
  };

  const replyDisabled = !stripHtml(reply).trim() || (!isSignedIn && !guestName.trim());

  return (
    <>
      <AnimatePresence>
        {confirmDisc ? (
          <Confirm
            message={t('confirmDeleteDiscussion', {title: resolveText(discussion.title, locale)})}
            confirmLabel={t('delete')}
            cancelLabel={t('cancel')}
            onOk={deleteDiscussion}
            onCancel={() => setConfirmDisc(false)}
          />
        ) : null}
        {confirmReplyId ? (
          <Confirm
            message={t('confirmDeleteReply')}
            confirmLabel={t('delete')}
            cancelLabel={t('cancel')}
            onOk={() => removeReply(confirmReplyId)}
            onCancel={() => setConfirmReplyId(null)}
          />
        ) : null}
      </AnimatePresence>

      <PageHero
        title={resolveText(displayed.title, locale)}
        subtitle={resolveText(displayed.summary, locale)}
        eyebrow={t('eyebrow')}
        actions={
          <Link
            href="/discussions"
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
            style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('browseAll')}
          </Link>
        }
      />

      <section className="py-12 sm:py-16">
        <Container className="space-y-6 sm:space-y-8">
          {isAdmin ? (
            <AdminInlineBar editing={editing} onToggle={toggleEditing} onSave={saveDraft} onCancel={stopEditing} onDelete={() => setConfirmDisc(true)} />
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="order-1 min-w-0 space-y-8 lg:order-1">
              <motion.article
                {...getRevealProps(prefersReducedMotion, 0.03)}
                className="relative overflow-hidden rounded-[32px] p-6 sm:p-8"
                style={{
                  background: 'var(--surface-1)',
                  boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 2px 8px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />
                <div className="relative">
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{background: 'var(--accent-m)', color: 'var(--accent)'}}
                    >
                      {resolveText(displayed.category, locale)}
                    </span>
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{color: 'var(--text-4)'}}
                    >
                      • {formatDateTime(displayed.createdAt, locale)}
                    </span>
                  </div>

                  {editing ? (
                    <RichTextEditor
                      value={resolveText(draft.content, locale)}
                      onChange={(value) => updateDraft((current) => ({...current, content: updateTextValue(current.content, locale, value)}))}
                      placeholder={t('formContent')}
                    />
                  ) : (
                    <DiscussionRichContent html={resolveText(displayed.content, locale)} />
                  )}
                </div>
              </motion.article>

              <motion.section
                {...getRevealProps(prefersReducedMotion, 0.08)}
                className="rounded-[32px] p-6 sm:p-8"
                style={{
                  background: 'var(--surface-1)',
                  boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 2px 8px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b pb-6" style={{borderColor: 'var(--border-faint)'}}>
                  <div>
                    <h2 className="text-xl font-bold" style={{color: 'var(--text-1)'}}>
                      {common('messages')}
                    </h2>
                    <p className="mt-1 text-sm font-medium" style={{color: 'var(--text-4)'}}>
                      {t('repliesCount', {count: discussion.messages.length})}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  {discussion.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      {...getRevealProps(prefersReducedMotion, 0.1 + index * 0.04, 18)}
                      className="relative pl-12"
                    >
                      {index < discussion.messages.length - 1 ? (
                        <span
                          className="absolute left-[18px] top-11 bottom-[-24px] w-px"
                          style={{background: 'var(--border-1)'}}
                        />
                      ) : null}

                      <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-bold text-cyan-400">
                        {message.author.name.charAt(0).toUpperCase()}
                      </div>

                      <div
                        className="group rounded-[28px] p-5 sm:p-6"
                        style={{background: 'var(--surface-1)', border: '1px solid var(--border-faint)'}}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                              <span className="break-words text-sm font-bold" style={{color: 'var(--text-1)'}}>
                                {message.author.name}
                              </span>
                              <span
                                className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
                                style={{background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: 'var(--text-4)'}}
                              >
                                {resolveText(message.author.badge, locale)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] font-medium" style={{color: 'var(--text-4)'}}>
                              {formatDateTime(message.createdAt, locale)}
                            </p>
                          </div>

                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setConfirmReplyId(message.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-400 transition hover:bg-rose-500/20 md:opacity-0 md:group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('delete')}
                            </button>
                          ) : null}
                        </div>

                        <DiscussionRichContent html={resolveText(message.text, locale)} className="mt-4" />
                      </div>
                    </motion.div>
                  ))}

                  {discussion.messages.length === 0 ? (
                    <div
                      className="rounded-[28px] border border-dashed px-5 py-8 text-center text-sm font-medium"
                      style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-4)'}}
                    >
                      {t('replyEmpty')}
                    </div>
                  ) : null}
                </div>
              </motion.section>

              <motion.section
                {...getRevealProps(prefersReducedMotion, 0.12)}
                id="reply-form"
                className="rounded-[32px] p-6 sm:p-8"
                style={{
                  background: 'var(--surface-1)',
                  boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 2px 8px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                    <PencilLine className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold" style={{color: 'var(--text-1)'}}>
                      {t('replyTitle')}
                    </h2>
                  </div>
                </div>

                <div className="space-y-5">
                  <div
                    className="flex flex-wrap items-center gap-4 rounded-[24px] border px-4 py-3.5"
                    style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-bold text-cyan-400">
                      {(session?.name || guestName || 'G').charAt(0).toUpperCase()}
                    </div>
                    {isSignedIn ? (
                      <span className="text-sm font-semibold" style={{color: 'var(--text-2)'}}>
                        {t('replyIdentity', {name: session?.name || 'Account'})}
                      </span>
                    ) : (
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                          {t('replyNameLabel')}
                        </label>
                        <input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder={t('replyNamePlaceholder')}
                          className="w-full bg-transparent text-sm font-medium outline-none"
                          style={{color: 'var(--text-1)'}}
                        />
                      </div>
                    )}
                  </div>

                  <RichTextEditor value={reply} onChange={setReply} placeholder={t('replyPlaceholder')} />

                  <button
                    type="button"
                    onClick={submitReply}
                    disabled={replyDisabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <SendHorizontal className="h-4.5 w-4.5" />
                    {t('replySubmit')}
                  </button>
                </div>
              </motion.section>
            </div>

            <motion.aside
              {...getRevealProps(prefersReducedMotion, 0.04)}
              className="order-2 sticky top-24 self-start lg:order-2"
            >
              <div
                className="rounded-[32px] p-6 sm:p-7"
                style={{
                  background: 'var(--surface-1)',
                  boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 2px 8px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                {editing ? (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                        {t('editTitle')}
                      </label>
                      <input
                        value={resolveText(draft.title, locale)}
                        onChange={(event) => updateDraft((current) => ({...current, title: updateTextValue(current.title, locale, event.target.value)}))}
                        className="w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-sm font-medium outline-none"
                        style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                        {t('editCategory')}
                      </label>
                      <input
                        value={resolveText(draft.category, locale)}
                        onChange={(event) => updateDraft((current) => ({...current, category: updateTextValue(current.category, locale, event.target.value)}))}
                        className="w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-sm font-medium outline-none"
                        style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                        {t('editSummary')}
                      </label>
                      <textarea
                        value={resolveText(draft.summary, locale)}
                        onChange={(event) => updateDraft((current) => ({...current, summary: updateTextValue(current.summary, locale, event.target.value)}))}
                        className="min-h-24 w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-sm font-medium outline-none"
                        style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                        {t('editAuthor')}
                      </label>
                      <input
                        value={draft.author.name}
                        onChange={(event) => updateDraft((current) => ({...current, author: {...current.author, name: event.target.value}}))}
                        className="w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-sm font-medium outline-none"
                        style={{borderColor: 'var(--border-1)', color: 'var(--text-1)'}}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="rounded-[24px] p-4" style={{background: 'var(--surface-1)', border: '1px solid var(--border-faint)'}}>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                          <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" />
                          {common('category')}
                        </div>
                        <p className="mt-3 text-base font-bold" style={{color: 'var(--text-1)'}}>
                          {resolveText(displayed.category, locale)}
                        </p>
                      </div>

                      <div className="rounded-[24px] p-4" style={{background: 'var(--surface-1)', border: '1px solid var(--border-faint)'}}>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                          <User2 className="h-3.5 w-3.5 text-cyan-400" />
                          {common('by')}
                        </div>
                        <p className="mt-3 text-base font-bold" style={{color: 'var(--text-1)'}}>
                          {displayed.author.name}
                        </p>
                        <p className="mt-1 text-sm font-medium" style={{color: 'var(--text-4)'}}>
                          {resolveText(displayed.author.title, locale)}
                        </p>
                      </div>

                      <div className="rounded-[24px] p-4" style={{background: 'var(--surface-1)', border: '1px solid var(--border-faint)'}}>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                          <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                          {common('posted')}
                        </div>
                        <p className="mt-3 text-sm font-semibold" style={{color: 'var(--text-1)'}}>
                          {formatDateTime(displayed.createdAt, locale)}
                        </p>
                      </div>

                      <div className="rounded-[24px] p-4" style={{background: 'var(--surface-1)', border: '1px solid var(--border-faint)'}}>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--text-4)'}}>
                          <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" />
                          {common('messages')}
                        </div>
                        <p className="mt-3 text-base font-bold" style={{color: 'var(--text-1)'}}>
                          {t('repliesCount', {count: displayed.messages.length})}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <a
                        href="#reply-form"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-400"
                      >
                        <PencilLine className="h-4.5 w-4.5" />
                        {t('replyTitle')}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </div>
        </Container>
      </section>
    </>
  );
}
