'use client';

import {useTranslations} from 'next-intl';
import {RichTextEditor} from '@/components/editor/rich-text-editor';

export function DiscussionEditor() {
  const t = useTranslations('discussions');
  const common = useTranslations('common');

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{t('createTitle')}</p>
        <h3 className="text-2xl font-semibold text-white">{t('publish')}</h3>
        <p className="text-sm leading-7 text-slate-300">{t('signinHint')}</p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/90">{t('formTitle')}</span>
          <input
            placeholder={t('formTitle')}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/90">{t('toolbar')}</span>
          <RichTextEditor />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">
            {t('publish')}
          </button>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400">
            {common('notImplemented')}
          </span>
        </div>
      </div>
    </div>
  );
}
