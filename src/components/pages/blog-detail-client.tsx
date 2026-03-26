'use client';

import {AlertTriangle, ArrowLeft, Clock, Heart, MessageSquare, Star, Trash2, Upload, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {BlogContentRenderer} from '@/components/blog/blog-content-renderer';
import {ContentBlockEditor} from '@/components/editor/content-block-editor';
import {DynamicMedia, MediaTypeBadge} from '@/components/ui/dynamic-media';
import {ImageEditor} from '@/components/ui/image-editor';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {isLiveModeEnabled, useDemoSession} from '@/lib/auth';
import {addComment, deletePostApi, likePost} from '@/lib/api-service';
import {useManagedBlogPosts} from '@/lib/demo-store';
import {uploadMediaSource} from '@/lib/imagekit';
import type {BlogPost, Locale} from '@/lib/types';
import {estimateReadingTimeFromBlocks, formatDateTime, formatTimestamp, makeId, resolveText} from '@/lib/utils';

const IS_LIVE = isLiveModeEnabled();


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
            <X className="h-3.5 w-3.5 inline mr-1"/>Bekor
          </button>
          <button type="button" onClick={onOk} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
            <Trash2 className="h-3.5 w-3.5 inline mr-1"/>O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlogDetailClient({initialPosts, slug}: {initialPosts: BlogPost[]; slug: string}) {
  const locale = useLocale() as Locale;
  const common = useTranslations('common');
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
    const livePost = posts.find((item) => item.slug === slug);
    if (livePost) return livePost;
    if (IS_LIVE && hydrated) return null;
    return initialPosts.find((item) => item.slug === slug) ?? null;
  }, [hydrated, initialPosts, posts, slug]);
  const [draft, setDraft] = useState<BlogPost|null>(post);

  useEffect(() => { setDraft(post); }, [post]);
  useEffect(() => { if (isAdmin && searchParams.get('edit') === '1') setEditing(true); }, [isAdmin, searchParams]);

  if (!post || !draft) return (
    <section className="py-20"><Container>
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        Post topilmadi.{' '}<Link href="/blog" className="text-cyan-300 hover:text-cyan-200">Blog sahifasiga qaytish</Link>
      </div>
    </Container></section>
  );

  const saveDraft = () => {
    setPosts(posts.map(p => p.slug === slug ? {...draft, readingTime: estimateReadingTimeFromBlocks(draft.blocks)} : p));
    setEditing(false);
  };

  const cancelDraft = () => { setDraft(post); setEditing(false); };
  const deletePost = async () => {
    if (IS_LIVE) {
      try {
        await deletePostApi(slug);
        replacePosts((current) => current.filter((postItem) => postItem.slug !== slug));
        router.push('/blog');
      } catch (error) {
        if (error instanceof Error && error.message.includes('API 404')) {
          replacePosts((current) => current.filter((postItem) => postItem.slug !== slug));
          router.push('/blog');
          return;
        }
        console.error(`Failed to delete post ${slug}.`, error);
      }
      return;
    }
    setPosts(posts.filter(p => p.slug !== slug));
    router.push('/blog');
  };

  const removeComment = (id: string) => {
    setPosts(posts.map(p => p.slug === slug ? {...p, comments: p.comments.filter(c => c.id !== id)} : p));
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const updated = await addComment(slug, {
        author: commentName.trim() || session?.name || 'Guest',
        message: commentText.trim()
      });
      setPosts(posts.map((p) => p.slug === slug ? updated : p));
    } catch {
      setPosts(posts.map(p => p.slug === slug ? {
        ...p,
        comments: [...p.comments, {id: makeId('comment'), author: commentName.trim() || session?.name || 'Guest', message: commentText.trim(), createdAt: new Date().toISOString()}]
      } : p));
    }
    setCommentText(''); setCommentName(''); setCommentsOpen(true);
  };

  const toggleLike = async () => {
    try {
      const updated = await likePost(slug);
      setPosts(posts.map((p) => p.slug === slug ? updated : p));
    } catch {
      setPosts(posts.map(p => p.slug === slug ? {...p, likes: p.likes + 1} : p));
    }
  };
  const displayed = editing ? draft : post;
  const readTime = displayed.readingTime || estimateReadingTimeFromBlocks(displayed.blocks);

  return (
    <>
      {showDeleteConfirm && <Confirm title={resolveText(post.title, locale)} onOk={deletePost} onCancel={() => setShowDeleteConfirm(false)} />}

      <PageHero title={resolveText(displayed.title, locale)} subtitle={resolveText(displayed.excerpt, locale)} eyebrow="BLOG POST" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-6">
          {isAdmin && (
            <AdminInlineBar editing={editing} onToggle={() => setEditing(v => !v)}
              onSave={saveDraft} onCancel={cancelDraft} onDelete={() => setShowDeleteConfirm(true)} />
          )}

          <Link href="/blog" className="inline-flex cursor-pointer items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" /> Barcha postlar
          </Link>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
              {editing ? (
                <div className="space-y-4">
                  {/* Title */}
                  <input value={resolveText(draft.title, locale)}
                    onChange={e => setDraft({...draft, title: e.target.value})}
                    className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-4 text-2xl font-semibold text-white outline-none"
                    placeholder="Post sarlavhasi" />
                  {/* Excerpt */}
                  <textarea value={resolveText(draft.excerpt, locale)}
                    onChange={e => setDraft({...draft, excerpt: e.target.value})}
                    className="min-h-20 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-3 text-sm text-slate-200 outline-none"
                    placeholder="Qisqacha kirish" />

                  {/* Cover media */}
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">Cover media</p>
                        <p className="text-xs text-slate-400">Rasm yoki video URL. Bo'sh qoldirish ham mumkin.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.cover && !editingCover && (
                          <button type="button" onClick={() => setEditingCover(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-400/20">
                            Tahrirlash
                          </button>
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                          <Upload className="h-3.5 w-3.5" /> Yuklash
                          <input type="file" accept="image/*,video/*" className="hidden"
                            onChange={async e => {
                              const input = e.currentTarget;
                              const file = input.files?.[0];
                              if (!file) return;
                              try {
                                const media = await uploadMediaSource(file, {ownerType: 'post', ownerSlug: slug, role: 'cover'});
                                setDraft({...draft, cover: media.url});
                                setEditingCover(false);
                              } finally {
                                input.value = '';
                              }
                            }} />
                        </label>
                        {draft.cover && (
                          <button type="button" onClick={() => { setDraft({...draft, cover: ''}); setEditingCover(false); }}
                            className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20">
                            <Trash2 className="h-3.5 w-3.5 inline mr-1" />O'chirish
                          </button>
                        )}
                      </div>
                    </div>

                    {editingCover && draft.cover ? (
                      <ImageEditor src={draft.cover}
                        onSave={async (dataUrl) => {
                          const media = await uploadMediaSource(dataUrl, {ownerType: 'post', ownerSlug: slug, role: 'cover'});
                          setDraft({...draft, cover: media.url});
                          setEditingCover(false);
                        }}
                        onCancel={() => setEditingCover(false)} />
                    ) : (
                      <>
                        <MediaTypeBadge src={draft.cover} />
                        <DynamicMedia src={draft.cover} alt={resolveText(draft.title, locale)}
                          className="rounded-[20px] border border-white/10"
                          placeholderTitle="Cover tanlanmagan" placeholderHint="Rasm yoki video URL kiriting." />
                        <input value={draft.cover} onChange={e => setDraft({...draft, cover: e.target.value})}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none"
                          placeholder="Cover rasm yoki video URL" />
                      </>
                    )}
                  </div>

                  {/* Meta fields */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Sana</span>
                      <input value={draft.publishedAt} onChange={e => setDraft({...draft, publishedAt: e.target.value})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Muallif</span>
                      <input value={draft.author.name} onChange={e => setDraft({...draft, author: {...draft.author, name: e.target.value}})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs text-slate-400">Holat</span>
                      <button type="button" onClick={() => setDraft({...draft, featured: !draft.featured})}
                        className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-sm outline-none transition ${draft.featured ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-slate-950/80 text-white'}`}>
                        {draft.featured ? '⭐ Featured' : 'Oddiy post'}
                      </button>
                    </label>
                  </div>

                  {/* Block editor */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Kontent bloklari</p>
                    <ContentBlockEditor blocks={draft.blocks} onChange={blocks => setDraft({...draft, blocks})} locale={locale} uploadContext={{ownerType: 'post', ownerSlug: slug}} />
                  </div>
                </div>
              ) : (
                <>
                  {/* Post header */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{formatTimestamp(post.publishedAt, locale)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime} daq</span>
                      <span>·</span>
                      <span>{post.author.name}</span>
                      {post.featured && (
                        <><span>·</span>
                          <span className="flex items-center gap-1 text-cyan-300"><Star className="h-3.5 w-3.5" /> Featured</span></>
                      )}
                    </div>
                    <DynamicMedia src={post.cover} alt={resolveText(post.title, locale)}
                      className="rounded-[20px] border border-white/10 bg-slate-950/50"
                      placeholderTitle="" placeholderHint="" />
                    <BlogContentRenderer blocks={post.blocks} />
                  </div>

                  {/* Engagement bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <button type="button" onClick={toggleLike}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-cyan-400/10 hover:text-cyan-300">
                      <Heart className="h-4 w-4 text-cyan-300" /> {post.likes} like
                    </button>
                    <button type="button" onClick={() => setCommentsOpen(v => !v)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                      <MessageSquare className="h-4 w-4 text-cyan-300" />
                      {commentsOpen ? 'Yopish' : `Izohlar (${post.comments.length})`}
                    </button>
                  </div>

                  {/* Comments */}
                  {commentsOpen && (
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{common('comments')}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">{post.comments.length} ta</span>
                      </div>
                      <div className="space-y-3">
                        {post.comments.map(c => (
                          <div key={c.id} className="group rounded-[16px] border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-300">
                                    {c.author.charAt(0).toUpperCase()}
                                  </div>
                                  <p className="text-sm font-medium text-white">{c.author}</p>
                                </div>
                                {c.createdAt && <p className="mt-0.5 ml-8 text-[11px] text-slate-500">{formatDateTime(c.createdAt, locale)}</p>}
                              </div>
                              {isAdmin && (
                                <button type="button" onClick={() => removeComment(c.id)}
                                  className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20">
                                  <Trash2 className="h-3 w-3 inline mr-1"/>O'chirish
                                </button>
                              )}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-300 whitespace-pre-wrap">
                              {typeof c.message === 'string' ? c.message : resolveText(c.message, locale)}
                            </p>
                          </div>
                        ))}
                        {post.comments.length === 0 && (
                          <div className="rounded-[16px] border border-dashed border-white/10 p-4 text-center text-sm text-slate-400">
                            Hali izoh yo'q. Birinchi bo'ling!
                          </div>
                        )}
                      </div>
                      {/* Add comment */}
                      <div className="border-t border-white/10 pt-4 space-y-3">
                        <input value={commentName} onChange={e => setCommentName(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Ismingiz" />
                        <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Izoh yozing..." />
                        <button type="button" onClick={submitComment}
                          className="w-full cursor-pointer rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
                          Izoh qo'shish
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Post haqida</h3>
                  {[
                    {label: 'Muallif', value: displayed.author.name},
                    {label: "O'qish vaqti", value: `${readTime} daqiqa`},
                    {label: 'Sana', value: formatTimestamp(displayed.publishedAt, locale)},
                    {label: 'Izohlar', value: `${post.comments.length} ta`},
                    {label: 'Like', value: `${post.likes}`},
                  ].map(({label, value}) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-medium text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {isAdmin && !editing && (
                  <div className="rounded-[20px] border border-cyan-300/10 bg-cyan-400/5 p-4">
                    <p className="text-xs text-slate-400">Admin: yuqoridagi <span className="text-cyan-300">Sahifada tahrirlash</span> tugmasini bosing.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
