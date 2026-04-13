'use client';

import {AlertTriangle, ArrowLeft, Clock, Heart, MessageSquare, Star, Trash2, Upload, X} from 'lucide-react';
import {useLocale} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Link, useRouter} from '@/i18n/navigation';
import {BlogContentRenderer} from '@/components/blog/blog-content-renderer';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {ContentBlockEditor} from '@/components/editor/content-block-editor';
import {DynamicMedia, MediaTypeBadge} from '@/components/ui/dynamic-media';
import {ImageEditor} from '@/components/ui/image-editor';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {addComment, deleteComment, deletePostApi, likePost} from '@/lib/api-service';
import {useManagedBlogPosts} from '@/lib/demo-store';
import {uploadMediaSource} from '@/lib/imagekit';
import type {BlogPost, Locale} from '@/lib/types';
import {estimateReadingTimeFromBlocks, formatDateTime, formatTimestamp, resolveText} from '@/lib/utils';

function Confirm({title, onOk, onCancel}: {title:string; onOk:()=>void; onCancel:()=>void}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'var(--overlay-bg)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-md rounded-[24px] border border-rose-400/20 p-6 shadow-2xl" style={{background:'var(--elevated)'}}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-white">Postni o'chirish</p>
            <p className="mt-1 text-sm text-slate-300">"{title}" o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
            <X className="mr-1 inline h-3.5 w-3.5" />Bekor
          </button>
          <button type="button" onClick={onOk} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlogDetailClient({initialPosts, slug}: {initialPosts: BlogPost[]; slug: string}) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const {isAdmin, session} = useDemoSession();
  const [posts, setPosts, hydrated, replacePosts] = useManagedBlogPosts(initialPosts);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCover, setEditingCover] = useState(false);

  const post = useMemo(() => {
    const current = posts.find((item) => item.slug === slug);
    if (current) return current;
    if (hydrated) return null;
    return initialPosts.find((item) => item.slug === slug) ?? null;
  }, [hydrated, initialPosts, posts, slug]);

  const [draft, setDraft] = useState<BlogPost | null>(post);

  useEffect(() => {
    setDraft(post);
  }, [post]);

  useEffect(() => {
    if (isAdmin && searchParams.get('edit') === '1') {
      setEditing(true);
    }
  }, [isAdmin, searchParams]);

  if (!post || !draft) {
    return (
      <section className="py-20">
        <Container>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            Post topilmadi. <Link href="/blog" className="text-cyan-300 hover:text-cyan-200">Blog sahifasiga qaytish</Link>
          </div>
        </Container>
      </section>
    );
  }

  const saveDraft = () => {
    setPosts((current) => current.map((item) => item.slug === slug ? {
      ...draft,
      readingTime: estimateReadingTimeFromBlocks(draft.blocks)
    } : item));
    setEditing(false);
  };

  const cancelDraft = () => {
    setDraft(post);
    setEditing(false);
  };

  const deletePost = async () => {
    try {
      await deletePostApi(slug);
      replacePosts((current) => current.filter((item) => item.slug !== slug));
      router.push('/blog');
    } catch (error) {
      if (error instanceof Error && error.message.includes('API 404')) {
        replacePosts((current) => current.filter((item) => item.slug !== slug));
        router.push('/blog');
        return;
      }
      console.error(`Failed to delete post ${slug}.`, error);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment(slug, commentId);
      replacePosts((current) => current.map((item) => item.slug === slug ? {
        ...item,
        comments: item.comments.filter((comment) => comment.id !== commentId)
      } : item));
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}.`, error);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    try {
      const updated = await addComment(slug, {
        author: commentName.trim() || session?.name || 'Guest',
        message: commentText.trim()
      });
      replacePosts((current) => current.map((item) => item.slug === slug ? updated : item));
      setCommentText('');
      setCommentName('');
      setCommentsOpen(true);
    } catch (error) {
      console.error(`Failed to add comment on ${slug}.`, error);
    }
  };

  const toggleLike = async () => {
    try {
      const updated = await likePost(slug);
      replacePosts((current) => current.map((item) => item.slug === slug ? updated : item));
    } catch (error) {
      console.error(`Failed to like post ${slug}.`, error);
    }
  };

  const displayed = editing ? draft : post;
  const readTime = displayed.readingTime || estimateReadingTimeFromBlocks(displayed.blocks);

  return (
    <>
      {showDeleteConfirm ? <Confirm title={resolveText(post.title, locale)} onOk={deletePost} onCancel={() => setShowDeleteConfirm(false)} /> : null}

      <PageHero title={resolveText(displayed.title, locale)} subtitle={resolveText(displayed.excerpt, locale)} eyebrow="BLOG POST" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-6">
          {isAdmin ? (
            <AdminInlineBar editing={editing} onToggle={() => setEditing((value) => !value)} onSave={saveDraft} onCancel={cancelDraft} onDelete={() => setShowDeleteConfirm(true)} />
          ) : null}

          <Link href="/blog" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" /> Barcha postlar
          </Link>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <article className="min-w-0 space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
              {editing ? (
                <div className="space-y-4">
                  <input
                    value={resolveText(draft.title, locale)}
                    onChange={(event) => setDraft({...draft, title: event.target.value})}
                    className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-4 text-2xl font-semibold text-white outline-none"
                    placeholder="Post sarlavhasi"
                  />
                  <textarea
                    value={resolveText(draft.excerpt, locale)}
                    onChange={(event) => setDraft({...draft, excerpt: event.target.value})}
                    className="min-h-20 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-3 text-sm text-slate-200 outline-none"
                    placeholder="Qisqacha kirish"
                  />

                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">Cover media</p>
                        <p className="text-xs text-slate-400">Rasm yoki video URL. Bo'sh qoldirish ham mumkin.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.cover && !editingCover ? (
                          <button type="button" onClick={() => setEditingCover(true)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-400/20">
                            Tahrirlash
                          </button>
                        ) : null}
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                          <Upload className="h-3.5 w-3.5" /> Yuklash
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={async (event) => {
                              const input = event.currentTarget;
                              const file = input.files?.[0];
                              if (!file) return;
                              try {
                                const media = await uploadMediaSource(file, {ownerType: 'post', ownerSlug: slug, role: 'cover'});
                                setDraft({...draft, cover: media.url});
                                setEditingCover(false);
                              } finally {
                                input.value = '';
                              }
                            }}
                          />
                        </label>
                        {draft.cover ? (
                          <button type="button" onClick={() => { setDraft({...draft, cover: ''}); setEditingCover(false); }} className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20">
                            <Trash2 className="mr-1 inline h-3.5 w-3.5" />O'chirish
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {editingCover && draft.cover ? (
                      <ImageEditor
                        key={draft.cover}
                        src={draft.cover}
                        onSave={async (dataUrl) => {
                          const media = await uploadMediaSource(dataUrl, {ownerType: 'post', ownerSlug: slug, role: 'cover'});
                          setDraft({...draft, cover: media.url});
                          setEditingCover(false);
                        }}
                        onCancel={() => setEditingCover(false)}
                      />
                    ) : (
                      <>
                        <MediaTypeBadge src={draft.cover} />
                        <DynamicMedia src={draft.cover} alt={resolveText(draft.title, locale)} className="rounded-[20px] border border-white/10" placeholderTitle="Cover tanlanmagan" placeholderHint="Rasm yoki video URL kiriting." />
                        <input
                          value={draft.cover}
                          onChange={(event) => setDraft({...draft, cover: event.target.value})}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none"
                          placeholder="Cover rasm yoki video URL"
                        />
                      </>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Sana</span>
                      <input value={draft.publishedAt} onChange={(event) => setDraft({...draft, publishedAt: event.target.value})} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Muallif</span>
                      <input value={draft.author.name} onChange={(event) => setDraft({...draft, author: {...draft.author, name: event.target.value}})} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Holat</span>
                      <button type="button" onClick={() => setDraft({...draft, featured: !draft.featured})} className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-sm outline-none transition ${draft.featured ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-slate-950/80 text-white'}`}>
                        {draft.featured ? '⭐ Featured' : 'Oddiy post'}
                      </button>
                    </label>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Kontent bloklari</p>
                    <ContentBlockEditor blocks={draft.blocks} onChange={(blocks) => setDraft({...draft, blocks})} locale={locale} uploadContext={{ownerType: 'post', ownerSlug: slug}} />
                  </div>
                </div>
              ) : (
                <>
                  <DynamicMedia src={displayed.cover} alt={resolveText(displayed.title, locale)} className="rounded-[28px] border border-white/10" placeholderTitle={resolveText(displayed.title, locale)} placeholderHint="" />
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span>{formatTimestamp(displayed.publishedAt, locale)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime} daq</span>
                    <span>{displayed.author.name}</span>
                  </div>
                  <BlogContentRenderer blocks={displayed.blocks} />
                </>
              )}
            </article>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Post meta</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Muallif</span>
                    <span className="font-medium text-white">{displayed.author.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Sana</span>
                    <span className="font-medium text-white">{formatDateTime(displayed.publishedAt, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Komment</span>
                    <span className="font-medium text-white">{displayed.comments.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Likes</span>
                    <span className="font-medium text-white">{displayed.likes}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={toggleLike} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                    <Heart className="h-4 w-4" /> Like
                  </button>
                  <button type="button" onClick={() => setCommentsOpen((value) => !value)} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                    <MessageSquare className="h-4 w-4" /> Kommentlar
                  </button>
                  {displayed.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">
                      <Star className="h-3.5 w-3.5" /> Featured
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Kommentlar</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{displayed.comments.length}</span>
                </div>

                {commentsOpen ? (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-3">
                      <input value={commentName} onChange={(event) => setCommentName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Ismingiz" />
                      <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Fikringizni yozing..." />
                      <button type="button" onClick={submitComment} className="w-full cursor-pointer rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                        Komment yuborish
                      </button>
                    </div>

                    <div className="space-y-3 border-t border-white/10 pt-4">
                      {displayed.comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-400">
                          Hali komment yo'q.
                        </div>
                      ) : displayed.comments.map((comment) => (
                        <div key={comment.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{comment.author}</p>
                              {comment.createdAt ? <p className="mt-1 text-xs text-slate-500">{formatDateTime(comment.createdAt, locale)}</p> : null}
                            </div>
                            {isAdmin ? (
                              <button type="button" onClick={() => void removeComment(comment.id)} className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20">
                                <Trash2 className="mr-1 inline h-3 w-3" /> O'chirish
                              </button>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-300">{resolveText(comment.message, locale)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCommentsOpen(true)} className="mt-5 w-full cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10">
                    Kommentlarni ochish
                  </button>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
