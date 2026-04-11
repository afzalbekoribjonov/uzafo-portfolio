'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {LogOut, Mail, MessageCircle, MessagesSquare, Moon, Sparkles, Sun, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {useTranslations} from 'next-intl';
import {fetchDiscussions, fetchPosts} from '@/lib/api-service';
import {applyTheme, useTheme} from '@/lib/theme';
import type {Theme} from '@/lib/theme';
import type {DemoSession} from '@/lib/types';

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

function themeLabel(theme: Theme, t: (key: 'themeDark' | 'themeLight') => string) {
  return theme === 'dark' ? t('themeDark') : t('themeLight');
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
  const {theme} = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [liveActivity, setLiveActivity] = useState(activity);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLiveActivity(activity);
  }, [activity]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const themeOptions: Array<{value: Theme; label: string; Icon: typeof Sun}> = [
    {value: 'light', label: t('themeLight'), Icon: Sun},
    {value: 'dark', label: t('themeDark'), Icon: Moon},
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && session ? (
        <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
          <motion.button
            key="account-backdrop"
            type="button"
            aria-label={t('close')}
            className="pointer-events-auto absolute inset-0 backdrop-blur-sm"
            style={{background: 'var(--overlay-bg)'}}
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
            className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-white/10 shadow-[0_24px_90px_rgba(2,6,23,0.38)] sm:max-w-md"
            style={{background: 'var(--elevated)'}}
            initial={{x: prefersReducedMotion ? 0 : 28, opacity: prefersReducedMotion ? 1 : 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: prefersReducedMotion ? 0 : 28, opacity: prefersReducedMotion ? 1 : 0}}
            transition={animation}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6" style={{background: 'var(--elevated)'}}>
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
              <div
                className="relative overflow-hidden rounded-[32px] border p-6"
                style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--surface-1), var(--elevated))'}}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{background: 'radial-gradient(circle at 10% 10%, rgba(34,211,238,0.12), transparent 35%), radial-gradient(circle at 88% 16%, rgba(8,145,178,0.10), transparent 28%)'}}
                />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[24px] text-[1.75rem] font-black tracking-[0.08em]" style={{background: 'var(--accent-m)', color: 'var(--accent)'}}>
                    {firstLetter(session.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                        {t('title')}
                      </p>
                      <p className="truncate text-xl font-semibold" style={{color: 'var(--text-1)'}}>
                        {session.name}
                      </p>
                    </div>
                    <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{borderColor: 'var(--border-1)', background: 'var(--input-bg2)', color: 'var(--text-3)'}}>
                      <Mail className="h-3.5 w-3.5 shrink-0" style={{color: 'var(--accent)'}} />
                      <span className="truncate">{session.email}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-4)'}}>
                      <Sparkles className="h-3.5 w-3.5" style={{color: 'var(--accent)'}} />
                      {themeLabel(theme, t)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-6">
                <section className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                        {t('theme')}
                      </p>
                      <p className="mt-2 text-sm leading-6" style={{color: 'var(--text-3)'}}>
                        {t('themeAction')}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex w-full rounded-[22px] border p-1.5" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                    {themeOptions.map(({value, label, Icon}) => {
                      const active = theme === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => applyTheme(value)}
                          aria-pressed={active}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition"
                          style={{
                            background: active ? 'var(--elevated)' : 'transparent',
                            color: active ? 'var(--text-1)' : 'var(--text-3)',
                            boxShadow: active ? '0 8px 24px rgba(15,23,42,0.08)' : 'none',
                          }}
                        >
                          <Icon className="h-4 w-4" style={{color: active ? 'var(--accent)' : 'currentColor'}} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                      {t('comments')} / {t('discussions')}
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{color: 'var(--text-3)'}}>
                      {stats.commentCount + stats.discussionCount === 0
                        ? `${t('commentsEmpty')} ${t('discussionsEmpty')}`
                        : `${t('comments')}: ${stats.commentCount} · ${t('discussions')}: ${stats.discussionCount}`}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[28px] border" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                    <div className="grid divide-white/10 sm:grid-cols-2 sm:divide-x">
                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[16px]" style={{background: 'var(--accent-m)'}}>
                            <MessageCircle className="h-4 w-4" style={{color: 'var(--accent)'}} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                              {t('comments')}
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight" style={{color: 'var(--text-1)'}}>
                              {stats.commentCount}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6" style={{color: stats.commentCount === 0 ? 'var(--text-4)' : 'var(--text-3)'}}>
                          {stats.commentCount === 0 ? t('commentsEmpty') : `${stats.commentCount} ${t('comments').toLowerCase()}`}
                        </p>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[16px]" style={{background: 'var(--accent-m)'}}>
                            <MessagesSquare className="h-4 w-4" style={{color: 'var(--accent)'}} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                              {t('discussions')}
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight" style={{color: 'var(--text-1)'}}>
                              {stats.discussionCount}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6" style={{color: stats.discussionCount === 0 ? 'var(--text-4)' : 'var(--text-3)'}}>
                          {stats.discussionCount === 0 ? t('discussionsEmpty') : `${stats.discussionCount} ${t('discussions').toLowerCase()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4 sm:px-6" style={{background: 'var(--elevated)'}}>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition"
                style={{borderColor: 'rgba(225,29,72,0.16)', background: 'linear-gradient(180deg, rgba(225,29,72,0.10), rgba(225,29,72,0.04))', color: 'var(--danger)'}}
              >
                <LogOut className="h-4 w-4" />
                {t('signOut')}
              </button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
    ,
    document.body
  );
}
