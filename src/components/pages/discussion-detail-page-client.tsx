'use client';

import {AlertTriangle, ArrowLeft, MessageSquareText, PencilLine, Trash2, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {RichTextEditor} from '@/components/editor/rich-text-editor';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {isLiveModeEnabled, useDemoSession} from '@/lib/auth';
import {addReply as addReplyApi, deleteDiscussion as deleteDiscussionApi} from '@/lib/api-service';
import {useManagedDiscussions} from '@/lib/demo-store';
import type {Discussion, Locale} from '@/lib/types';
import {formatDateTime, makeId, resolveText, slugify} from '@/lib/utils';

const IS_LIVE = isLiveModeEnabled();

function Confirm({msg, onOk, onCancel}: {msg:string; onOk:()=>void; onCancel:()=>void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'var(--overlay-bg)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-md rounded-[24px] border border-rose-400/20 p-6 shadow-2xl" style={{background:'var(--elevated)'}}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <p className="text-sm text-slate-300">{msg}</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"><X className="h-3.5 w-3.5 inline mr-1"/>Bekor</button>
          <button type="button" onClick={onOk} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"><Trash2 className="h-3.5 w-3.5 inline mr-1"/>O'chirish</button>
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
  const [replyName, setReplyName] = useState('');
  const [reply, setReply] = useState('<p></p>');
  const [editing, setEditing] = useState(false);
  const [confirmDisc, setConfirmDisc] = useState(false);
  const [confirmReplyId, setConfirmReplyId] = useState<string|null>(null);

  const discussion = useMemo(
    () => discussions.find(d => d.slug === slug) ?? initialDiscussions.find(d => d.slug === slug) ?? null,
    [discussions, initialDiscussions, slug]
  );
  const [draft, setDraft] = useState<Discussion|null>(discussion);
  useEffect(() => setDraft(discussion), [discussion]);
  useEffect(() => { if (isAdmin && searchParams.get('edit') === '1') setEditing(true); }, [isAdmin, searchParams]);

  if (!discussion || !draft) return (
    <section className="py-20"><Container>
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        Muhokama topilmadi.{' '}
        <Link href="/discussions" className="text-cyan-300 hover:text-cyan-200">Qaytish</Link>
      </div>
    </Container></section>
  );

  const saveDraft = () => {
    const nextSlug = slugify(resolveText(draft.title, locale)) || draft.slug;
    const safeSlug = discussions.some(d => d.slug === nextSlug && d.slug !== slug) ? draft.slug : nextSlug;
    setDiscussions(discussions.map(d => d.slug === slug ? {...draft, slug: safeSlug} : d));
    setEditing(false);
    if (safeSlug !== slug) router.push(`/discussions/${safeSlug}`);
  };

  const deleteDiscussion = async () => {
    if (IS_LIVE) {
      try {
        await deleteDiscussionApi(slug);
        replaceDiscussions((current) => current.filter((discussionItem) => discussionItem.slug !== slug));
        router.push('/discussions');
      } catch (error) {
        console.error(`Failed to delete discussion ${slug}.`, error);
      }
      return;
    }
    setDiscussions(discussions.filter(d => d.slug !== slug));
    router.push('/discussions');
  };

  const removeReply = (id: string) => {
    setDiscussions(discussions.map(d => d.slug === slug ? {...d, messages: d.messages.filter(m => m.id !== id)} : d));
    setConfirmReplyId(null);
  };

  const submitReply = async () => {
    const text = reply.trim();
    if (!text || text === '<p></p>' || text === '<p><br></p>') return;
    if (IS_LIVE) {
      try {
        const updated = await addReplyApi(slug, {text: reply});
        replaceDiscussions((current) => current.map((discussionItem) => discussionItem.slug === slug ? updated : discussionItem));
        setReply('<p></p>');
        setReplyName('');
      } catch (error) {
        console.error(`Failed to add reply to discussion ${slug}.`, error);
      }
      return;
    }

    replaceDiscussions((current) => current.map((discussionItem) => discussionItem.slug === slug ? {
      ...discussionItem,
      messages: [...discussionItem.messages, {
        id: makeId('reply'),
        author: {name: replyName.trim() || session?.name || 'Guest', badge: isAdmin ? 'Admin' : 'Member'},
        text: reply,
        createdAt: new Date().toISOString()
      }]
    } : discussionItem));
    setReply('<p></p>');
    setReplyName('');
  };

  const displayed = editing ? draft : discussion;

  return (
    <>
      {confirmDisc && <Confirm msg={`"${resolveText(discussion.title,locale)}" va barcha javoblar o'chib ketadi.`} onOk={deleteDiscussion} onCancel={() => setConfirmDisc(false)} />}
      {confirmReplyId && <Confirm msg="Bu javobni o'chirmoqchimisiz?" onOk={() => removeReply(confirmReplyId)} onCancel={() => setConfirmReplyId(null)} />}

      <PageHero title={resolveText(displayed.title, locale)} subtitle={resolveText(displayed.summary, locale)} eyebrow="MUHOKAMA" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-6">
          {isAdmin && (
            <AdminInlineBar editing={editing} onToggle={() => setEditing(v => !v)} onSave={saveDraft}
              onCancel={() => {setDraft(discussion); setEditing(false);}} onDelete={() => setConfirmDisc(true)} />
          )}

          <Link href="/discussions" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" /> Barcha muhokamalar
          </Link>

          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            {/* Sidebar */}
            <aside>
              <div className="sticky top-24 rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
                {editing ? (
                  <div className="space-y-3">
                    {[
                      {label:'Sarlavha', key:'title' as const, type:'input'},
                      {label:'Kategoriya', key:'category' as const, type:'input'},
                      {label:'Qisqacha tavsif', key:'summary' as const, type:'textarea'},
                      {label:'Muallif', key:null as any, type:'static'},
                    ].map(({label, key, type}) => key ? (
                      <div key={label}>
                        <label className="mb-1 block text-[11px] text-slate-500">{label}</label>
                        {type === 'textarea' ? (
                          <textarea value={resolveText((draft as any)[key], locale)}
                            onChange={e => setDraft({...draft, [key]: e.target.value})}
                            className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                        ) : (
                          <input value={resolveText((draft as any)[key], locale)}
                            onChange={e => setDraft({...draft, [key]: e.target.value})}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                        )}
                      </div>
                    ) : null)}
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">Muallif ismi</label>
                      <input value={draft.author.name} onChange={e => setDraft({...draft, author: {...draft.author, name: e.target.value}})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('category')}</p>
                      <p className="mt-2 text-base font-semibold text-white">{resolveText(discussion.category, locale)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('by')}</p>
                      <p className="mt-2 font-semibold text-white">{discussion.author.name}</p>
                      <p className="text-sm text-slate-400">{resolveText(discussion.author.title, locale)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{common('posted')}</p>
                      <p className="mt-2 text-sm text-white">{formatDateTime(discussion.createdAt, locale)}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <MessageSquareText className="h-4 w-4 text-cyan-300" />
                        <span className="font-medium">{discussion.messages.length} ta javob</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* Main */}
            <div className="space-y-6">
              {/* Article */}
              <article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                {editing ? (
                  <RichTextEditor value={resolveText(draft.content, locale)}
                    onChange={val => setDraft({...draft, content: val})}
                    placeholder="Muhokama asosiy matnini yozing..." />
                ) : (
                  <div className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{__html: resolveText(discussion.content, locale)}} />
                )}
              </article>

              {/* Replies */}
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Javoblar</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{discussion.messages.length} ta</span>
                </div>

                <div className="space-y-4">
                  {discussion.messages.map(msg => (
                    <div key={msg.id} className="group rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
                            {msg.author.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{msg.author.name}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            {resolveText(msg.author.badge, locale)}
                          </span>
                          <span className="text-xs text-slate-500">{formatDateTime(msg.createdAt, locale)}</span>
                        </div>
                        {isAdmin && (
                          <button type="button" onClick={() => setConfirmReplyId(msg.id)}
                            className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20">
                            <Trash2 className="h-3 w-3 inline mr-1" /> O'chirish
                          </button>
                        )}
                      </div>
                      <div className="prose prose-invert mt-3 max-w-none text-sm"
                        dangerouslySetInnerHTML={{__html: resolveText(msg.text, locale)}} />
                    </div>
                  ))}
                  {discussion.messages.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
                      Hali javob yo'q. Birinchi foydali javobni qoldiring.
                    </div>
                  )}
                </div>
              </section>

              {/* Reply form */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PencilLine className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-lg font-semibold text-white">Javob yozing</h3>
                </div>
                {isSignedIn ? (
                  <div className="space-y-4">
                    {!IS_LIVE ? (
                      <input value={replyName} onChange={e => setReplyName(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                        placeholder="Demo uchun ism (ixtiyoriy)" />
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-300">
                          {(session?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-300">
                          {IS_LIVE
                            ? `${session?.name || 'Hisobingiz'} sifatida javob qoldirasiz`
                            : `${session?.name || 'Guest'} sifatida javob qoldirasiz`}
                        </span>
                      </div>
                    )}
                    <RichTextEditor value={reply} onChange={setReply} placeholder="Aniq va foydali javob yozing..." />
                    <button type="button" onClick={submitReply}
                      className="w-full cursor-pointer rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
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
