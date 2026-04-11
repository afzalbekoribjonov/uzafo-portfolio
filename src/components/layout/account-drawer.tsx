'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {LogOut, Mail, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {fetchDiscussions, fetchPosts} from '@/lib/api-service';
import type {DemoSession} from '@/lib/types';
import {cn} from '@/lib/utils';

export type AccountActivityData = {
  commentAuthors: string[];
  discussionParticipants: string[][];
};

function normalizeName(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function firstLetter(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
}

function buildActivityData(commentAuthors: string[], discussionParticipants: string[][]) {
  return {commentAuthors, discussionParticipants};
}

export function AccountDrawer({
  open,
  onClose,
  session,
  activity,
  onSignOut
}: {
  open: boolean;
  onClose: () => void;
  session: DemoSession | null;
  activity: AccountActivityData;
  onSignOut: () => void;
}) {
  const t = useTranslations('account');
  const prefersReducedMotion = useReducedMotion();
  const [liveActivity, setLiveActivity] = useState(activity);

  useEffect(() => {
    setLiveActivity(activity);
  }, [activity]);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    void Promise.all([fetchPosts(), fetchDiscussions()])
      .then(([posts, discussions]) => {
        if (!active) return;

        setLiveActivity(buildActivityData(
          posts.items.flatMap((post) => post.comments.map((comment) => comment.author)),
          discussions.items.map((discussion) => {
            const participants = new Set<string>();
            if (discussion.author.name.trim()) participants.add(discussion.author.name);
            discussion.messages.forEach((message) => {
              if (message.author.name.trim()) participants.add(message.author.name);
            });
            return [...participants];
          })
        ));
      })
      .catch(() => {
        // Keep the server-provided snapshot if refresh fails.
      });

    return () => {
      active = false;
    };
  }, [open]);

  const stats = useMemo(() => {
    const userName = normalizeName(session?.name);
    if (!userName) {
      return {commentCount: 0, discussionCount: 0};
    }

    const commentCount = liveActivity.commentAuthors.filter((author) => normalizeName(author) === userName).length;
    const discussionCount = liveActivity.discussionParticipants.filter((participants) =>
      participants.some((name) => normalizeName(name) === userName)
    ).length;

    return {commentCount, discussionCount};
  }, [liveActivity.commentAuthors, liveActivity.discussionParticipants, session?.name]);

  const animation = prefersReducedMotion
    ? {duration: 0}
    : {type: 'spring' as const, stiffness: 360, damping: 34, mass: 0.9};

  return (
    <AnimatePresence>
      {open && session ? (
        <>
          <motion.button
            key="account-backdrop"
            type="button"
            aria-label={t('close')}
            className="fixed inset-0 z-[69] bg-black/50 backdrop-blur-[2px]"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: prefersReducedMotion ? 0 : 0.18}}
            onClick={onClose}
          />
          <motion.aside
            key="account-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-drawer-title"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur-2xl sm:max-w-md"
            initial={{x: prefersReducedMotion ? 0 : 28, opacity: prefersReducedMotion ? 1 : 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: prefersReducedMotion ? 0 : 28, opacity: prefersReducedMotion ? 1 : 0}}
            transition={animation}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 id="account-drawer-title" className="text-base font-semibold" style={{color: 'var(--text-1)'}}>
                {t('title')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('close')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
                style={{color: 'var(--text-3)'}}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-2xl font-black tracking-[0.08em] text-cyan-300">
                    {firstLetter(session.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold" style={{color: 'var(--text-1)'}}>
                      {session.name}
                    </p>
                    <div className="mt-2 inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs" style={{color: 'var(--text-3)'}}>
                      <Mail className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      <span className="truncate">{session.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                        {t('comments')}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight" style={{color: 'var(--text-1)'}}>
                        {stats.commentCount}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs" style={{color: 'var(--text-3)'}}>
                      {t('comments')}
                    </div>
                  </div>
                  {stats.commentCount === 0 ? (
                    <p className={cn('mt-4 text-sm leading-6 text-slate-400')} style={{color: 'var(--text-4)'}}>
                      {t('commentsEmpty')}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                        {t('discussions')}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight" style={{color: 'var(--text-1)'}}>
                        {stats.discussionCount}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs" style={{color: 'var(--text-3)'}}>
                      {t('discussions')}
                    </div>
                  </div>
                  {stats.discussionCount === 0 ? (
                    <p className={cn('mt-4 text-sm leading-6 text-slate-400')} style={{color: 'var(--text-4)'}}>
                      {t('discussionsEmpty')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" />
                {t('signOut')}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
