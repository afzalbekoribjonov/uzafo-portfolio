'use client';

import {ArrowRight, BookOpen, Clock, Flame, Plus, Trash2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useState, useMemo} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {isLiveModeEnabled, useDemoSession} from '@/lib/auth';
import {createPost as createPostApi, deletePostApi} from '@/lib/api-service';
import {useManagedBlogPosts, useManagedProfile} from '@/lib/demo-store';
import type {BlogPost, Locale, Profile} from '@/lib/types';
import {estimateReadingTimeFromBlocks, formatTimestamp, makeId, resolveText} from '@/lib/utils';

const IS_LIVE = isLiveModeEnabled();

/* ── Featured Post Card ──────────────────────────────────────────────────── */
function FeaturedCard({post, locale, isAdmin, onDelete}: {post: BlogPost; locale: Locale; isAdmin: boolean; onDelete: () => void}) {
  const readTime = post.readingTime || estimateReadingTimeFromBlocks(post.blocks);
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition hover:border-cyan-300/20">
      <div className="grid lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col justify-between p-7 lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                <Flame className="h-3 w-3" /> Featured
              </span>
              <span className="text-xs text-slate-500">{formatTimestamp(post.publishedAt, locale)}</span>
            </div>
            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="text-2xl font-semibold leading-snug text-white transition group-hover:text-cyan-200 sm:text-3xl">
                {resolveText(post.title, locale)}
              </h2>
            </Link>
            <p className="text-sm leading-7 text-slate-300 line-clamp-3">
              {resolveText(post.excerpt, locale)}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {readTime} daq
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {post.comments.length} izoh
              </span>
              <span>{post.author.name}</span>
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              O'qish <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <DynamicMedia
            src={post.cover}
            alt={resolveText(post.title, locale)}
            className="h-full"
            mediaClassName="h-full w-full object-cover"
            placeholderTitle=""
            placeholderHint=""
          />
        </div>
      </div>
      {isAdmin ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <Link
            href={`/blog/${post.slug}?edit=1`}
            onClick={e => e.stopPropagation()}
            className="rounded-full border border-cyan-300/20 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur transition hover:bg-cyan-400/10"
          >
            Tahrirlash
          </Link>
          <button
            type="button"
            onClick={e => {e.preventDefault(); onDelete();}}
            className="rounded-full border border-rose-400/20 bg-slate-900/90 p-1.5 text-rose-300 backdrop-blur transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Post Card ───────────────────────────────────────────────────────────── */
function PostCard({post, locale, isAdmin, onDelete}: {post: BlogPost; locale: Locale; isAdmin: boolean; onDelete: () => void}) {
  const readTime = post.readingTime || estimateReadingTimeFromBlocks(post.blocks);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_8px_30px_rgba(34,211,238,0.08)]">
      {/* Cover */}
      <div className="aspect-[16/9] overflow-hidden bg-slate-900">
        <DynamicMedia
          src={post.cover}
          alt={resolveText(post.title, locale)}
          className="h-full w-full"
          mediaClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          placeholderTitle=""
          placeholderHint=""
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <span>{formatTimestamp(post.publishedAt, locale)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readTime} daq</span>
        </div>

        <Link href={`/blog/${post.slug}`} className="flex-1">
          <h3 className="text-base font-semibold leading-snug text-white transition group-hover:text-cyan-200 line-clamp-2">
            {resolveText(post.title, locale)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400 line-clamp-2">
            {resolveText(post.excerpt, locale)}
          </p>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-[11px] font-bold text-cyan-300">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-400">{post.author.name}</span>
          </div>
          <span className="text-xs text-slate-500">{post.comments.length} izoh</span>
        </div>
      </div>

      {/* Admin overlay */}
      {isAdmin ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <Link
            href={`/blog/${post.slug}?edit=1`}
            onClick={e => e.stopPropagation()}
            className="rounded-full border border-cyan-300/20 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-cyan-300 backdrop-blur transition hover:bg-cyan-400/10"
          >
            Tahrirlash
          </Link>
          <button
            type="button"
            onClick={e => {e.preventDefault(); onDelete();}}
            className="rounded-full border border-rose-400/20 bg-slate-900/90 p-1.5 text-rose-300 backdrop-blur transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export function BlogPageClient({initialPosts, initialProfile}: {initialPosts: BlogPost[]; initialProfile: Profile}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('blog');
  const router = useRouter();
  const {isAdmin} = useDemoSession();
  const [profile] = useManagedProfile(initialProfile);
  const [posts, setPosts, , replacePosts] = useManagedBlogPosts(initialPosts);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

  const ordered = useMemo(() => [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [posts]);
  const featured = useMemo(() => ordered.find(p => p.featured) ?? ordered[0] ?? null, [ordered]);
  const rest = useMemo(() => (featured ? ordered.filter(p => p.slug !== featured.slug) : ordered), [ordered, featured]);

  const createPost = async () => {
    const slug = `post-${Date.now()}`;
    const draft: BlogPost = {
      slug,
      title: 'Yangi blog post',
      excerpt: 'Post haqida bir-ikki qatorda kirish yozing.',
      cover: '',
      publishedAt: new Date().toISOString(),
      author: {name: profile.name, role: 'Developer'},
      readingTime: 1,
      likes: 0,
      dislikes: 0,
      featured: false,
      blocks: [{id: makeId('block'), type: 'richText', content: '<h2>Yangi post</h2><p>Yozishni boshlang...</p>'}],
      comments: []
    };
    try {
      const created = await createPostApi(draft);
      setPosts([created, ...posts]);
      router.push(`/blog/${created.slug}?edit=1`);
      return;
    } catch {}
    setPosts([draft, ...posts]);
    router.push(`/blog/${slug}?edit=1`);
  };

  const deletePost = async (slug: string) => {
    if (IS_LIVE) {
      try {
        await deletePostApi(slug);
        replacePosts((current) => current.filter((post) => post.slug !== slug));
      } catch (error) {
        console.error(`Failed to delete post ${slug}.`, error);
        return;
      }
    } else {
      setPosts(posts.filter(p => p.slug !== slug));
    }
    setConfirmSlug(null);
  };

  return (
    <>
      {/* Confirm delete */}
      {confirmSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-rose-400/20 bg-slate-900 p-6 shadow-2xl">
            <p className="font-semibold text-white">Postni o'chirish</p>
            <p className="mt-2 text-sm text-slate-300">
              "{resolveText(posts.find(p => p.slug === confirmSlug)?.title ?? '', locale)}" o'chirilsinmi?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmSlug(null)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">Bekor</button>
              <button type="button" onClick={() => deletePost(confirmSlug)} className="cursor-pointer rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">O'chirish</button>
            </div>
          </div>
        </div>
      ) : null}

      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="BLOG" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-10">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-slate-300">
                {ordered.length} ta post
              </span>
            </div>
            {isAdmin ? (
              <button
                type="button"
                onClick={createPost}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                <Plus className="h-4 w-4" /> {t('writePost')}
              </button>
            ) : null}
          </div>

          {/* Featured */}
          {featured ? (
            <FeaturedCard
              post={featured}
              locale={locale}
              isAdmin={isAdmin}
              onDelete={() => setConfirmSlug(featured.slug)}
            />
          ) : null}

          {/* Grid */}
          {rest.length > 0 ? (
            <>
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Barcha maqolalar</p>
                <div className="flex-1 border-t border-white/5" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map(post => (
                  <PostCard
                    key={post.slug}
                    post={post}
                    locale={locale}
                    isAdmin={isAdmin}
                    onDelete={() => setConfirmSlug(post.slug)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {ordered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-4 text-base font-medium text-slate-300">Hali post yo'q</p>
              <p className="mt-2 text-sm text-slate-500">Birinchi maqolangizni yozing.</p>
              {isAdmin ? (
                <button type="button" onClick={createPost} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  <Plus className="h-4 w-4" /> Birinchi postni yozing
                </button>
              ) : null}
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
