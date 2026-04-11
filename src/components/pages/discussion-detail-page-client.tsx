'use client';

import {AlertTriangle, ArrowLeft, MessageSquareText, PencilLine, Trash2, X} from 'lucide-react';
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
import type {Discussion, Locale} from '@/lib/types';
import {formatDateTime, resolveText, slugify, stripHtml} from '@/lib/utils';

function Confirm({msg, onOk, onCancel}: {msg:string; onOk:()=>void; onCancel:()=>void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'var(--overlay-bg)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-md rounded-[24px] border border-rose-400/20 p-6 shadow-2xl" style={{background:'var(--elevated)'}}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <p className="text-sm text-slate-300">{msg}</p>
        </div>
        <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"><X className="h-3.5 w-3.5 inline mr-1"/>Bekor</button>
          <button type="button" onClick={onOk} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"><Trash2 className="h-3.5 w-3.5 inline mr-1"/>O&apos;chirish</button>
        </div>
      </div>
    </div>
  );
}

export function DiscussionDetailPageClient({initialDiscussions, slug}: {initialDiscussions: Discussion[]; slug: string}) {
  const locale = useLocale() as Locale;
  const common = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const {isAdmin, session, isSignedIn} = useDemoSession();
  const [discussions, setDiscussions, , replaceDiscussions] = useManagedDiscussions(initialDiscussions);
  const [reply, setReply] = useState('<p></p>');
  const [editingOverride, setEditingOverride] = useState<boolean | null>(null);
  const [confirmDisc, setConfirmDisc] = useState(false);
  const [confirmReplyId, setConfirmReplyId] = useState<string|null>(null);

  const discussion = useMemo(
    () => discussions.find(d => d.slug === slug) ?? initialDiscussions.find(d => d.slug === slug) ?? null,
    [discussions, initialDiscussions, slug]
  );
  const [draftState, setDraftState] = useState<Discussion|null>(null);
  const editing = editingOverride ?? (isAdmin && searchParams.get('edit') === '1');

  if (!discussion) return (
    <section className="py-20"><Container>
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        Muhokama topilmadi.{' '}
        <Link href="/discussions" className="text-cyan-300 hover:text-cyan-200">Qaytish</Link>
      </div>
    </Container></section>
  );

  const draft = draftState ?? discussion;
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
    const safeSlug = discussions.some(d => d.slug === nextSlug && d.slug !== slug) ? draft.slug : nextSlug;
    setDiscussions(discussions.map(d => d.slug === slug ? {...draft, slug: safeSlug} : d));
    stopEditing();
    if (safeSlug !== slug) router.push(`/discussions/${safeSlug}`);
  };

  const deleteDiscussion = async () => {
    try {
      await deleteDiscussionApi(slug);
      replaceDiscussions((current) => current.filter((discussionItem) => discussionItem.slug !== slug));
      router.push('/discussions');
    } catch (error) {
      console.error(`Failed to delete discussion ${slug}.`, error);
    }
  };

  const removeReply = async (id: string) => {
    try {
      await deleteReplyApi(slug, id);
      replaceDiscussions((current) => current.map((discussionItem) => discussionItem.slug === slug ? {
        ...discussionItem,
        messages: discussionItem.messages.filter((message) => message.id !== id)
      } : discussionItem));
      setConfirmReplyId(null);
    } catch (error) {
      console.error(`Failed to delete reply ${id} on ${slug}.`, error);
    }
  };

  const submitReply = async () => {
    if (!stripHtml(reply).trim()) return;

    try {
      const updated = await addReplyApi(slug, {text: reply});
      replaceDiscussions((current) => current.map((discussionItem) => discussionItem.slug === slug ? updated : discussionItem));
      setReply('<p></p>');
    } catch (error) {
      console.error(`Failed to add reply to discussion ${slug}.`, error);
    }
  };

  const displayed = editing ? draft : discussion;
  const replyIsEmpty = !stripHtml(reply).trim();

  return (
    <>
      {confirmDisc && <Confirm msg={`"${resolveText(discussion.title,locale)}" va barcha javoblar o'chib ketadi.`} onOk={deleteDiscussion} onCancel={() => setConfirmDisc(false)} />}
      {confirmReplyId && <Confirm msg="Bu javobni o'chirmoqchimisiz?" onOk={() => removeReply(confirmReplyId)} onCancel={() => setConfirmReplyId(null)} />}

      <PageHero title={resolveText(displayed.title, locale)} subtitle={resolveText(displayed.summary, locale)} eyebrow="MUHOKAMA" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-6">
          {isAdmin && (
            <AdminInlineBar editing={editing} onToggle={toggleEditing} onSave={saveDraft}
              onCancel={stopEditing} onDelete={() => setConfirmDisc(true)} />
          )}

          <Link href="/discussions" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" /> Barcha muhokamalar
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="min-w-0 xl:self-start">
              <div className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 xl:sticky xl:top-24 xl:p-6">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">Sarlavha</label>
                      <input value={resolveText(draft.title, locale)} onChange={e => setDraftState({...draft, title: e.target.value})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">Kategoriya</label>
                      <input value={resolveText(draft.category, locale)} onChange={e => setDraftState({...draft, category: e.target.value})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">Qisqacha tavsif</label>
                      <textarea value={resolveText(draft.summary, locale)} onChange={e => setDraftState({...draft, summary: e.target.value})}
                        className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">Muallif ismi</label>
                      <input value={draft.author.name} onChange={e => setDraftState({...draft, author: {...draft.author, name: e.target.value}})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('category')}</p>
                      <p className="mt-2 break-words text-base font-semibold text-white">{resolveText(displayed.category, locale)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('by')}</p>
                      <p className="mt-2 break-words font-semibold text-white">{displayed.author.name}</p>
                      <p className="text-sm text-slate-400">{resolveText(displayed.author.title, locale)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('posted')}</p>
                      <p className="mt-2 text-sm text-white">{formatDateTime(displayed.createdAt, locale)}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <MessageSquareText className="h-4 w-4 text-cyan-300" />
                        <span className="font-medium">{displayed.messages.length} ta javob</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* Main */}
            <div className="min-w-0 space-y-6">
              {/* Article */}
              <article className="min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
                {editing ? (
                  <RichTextEditor value={resolveText(draft.content, locale)}
                    onChange={val => setDraftState({...draft, content: val})}
                    placeholder="Muhokama asosiy matnini yozing..." />
                ) : (
                  <DiscussionRichContent html={resolveText(displayed.content, locale)} />
                )}
              </article>

              {/* Replies */}
              <section className="min-w-0 space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Javoblar</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{discussion.messages.length} ta</span>
                </div>

                <div className="space-y-4">
                  {discussion.messages.map(msg => (
                    <div key={msg.id} className="group min-w-0 rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
                            {msg.author.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="break-words text-sm font-semibold text-white">{msg.author.name}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            {resolveText(msg.author.badge, locale)}
                          </span>
                          <span className="text-xs text-slate-500 sm:whitespace-nowrap">{formatDateTime(msg.createdAt, locale)}</span>
                        </div>
                        {isAdmin && (
                          <button type="button" onClick={() => setConfirmReplyId(msg.id)}
                            className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-500/20">
                            <Trash2 className="h-3 w-3 inline mr-1" /> O&apos;chirish
                          </button>
                        )}
                      </div>
                      <DiscussionRichContent html={resolveText(msg.text, locale)} className="mt-3" />
                    </div>
                  ))}
                  {discussion.messages.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
                      Hali javob yo&apos;q. Birinchi foydali javobni qoldiring.
                    </div>
                  )}
                </div>
              </section>

              {/* Reply form */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <PencilLine className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-lg font-semibold text-white">Javob yozing</h3>
                </div>
                {isSignedIn ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-300">
                        {(session?.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300">
                        {`${session?.name || 'Hisobingiz'} sifatida javob qoldirasiz`}
                      </span>
                    </div>
                    <RichTextEditor value={reply} onChange={setReply} placeholder="Aniq va foydali javob yozing..." />
                    <button type="button" onClick={submitReply} disabled={replyIsEmpty}
                      className="w-full cursor-pointer rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                      Javob yuborish
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <p className="text-sm text-slate-300">Javob qoldirish uchun{' '}
                      <Link href="/auth/sign-in" className="text-cyan-300 underline underline-offset-2 transition hover:text-cyan-200">tizimga kiring</Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
