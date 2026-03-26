'use client';

import {useLocale} from 'next-intl';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import type {BlogBlock, Locale} from '@/lib/types';
import {resolveText} from '@/lib/utils';

interface BlogContentRendererProps {
  blocks: BlogBlock[];
}

export function BlogContentRenderer({blocks}: BlogContentRendererProps) {
  const locale = useLocale() as Locale;

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const key = block.id || `block-${index}`;

        if (block.type === 'richText') {
          return (
            <div
              key={key}
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-code:text-cyan-200 prose-pre:border prose-pre:border-white/10 prose-pre:bg-slate-950 prose-blockquote:border-cyan-300/40 prose-blockquote:text-slate-200 prose-li:text-slate-300"
              dangerouslySetInnerHTML={{__html: resolveText(block.content, locale)}}
            />
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="rounded-[24px] border border-cyan-300/20 bg-cyan-400/5 px-5 py-4 text-lg font-medium leading-8 text-white">
              <div dangerouslySetInnerHTML={{__html: resolveText(block.content, locale)}} />
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={key} className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
              <div className="border-b border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-500">{block.language}</div>
              <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-cyan-200"><code>{resolveText(block.content, locale)}</code></pre>
            </div>
          );
        }

        if (block.type === 'image') {
          return (
            <div key={key} className="space-y-3">
              <DynamicMedia src={block.src} alt={resolveText(block.alt, locale)} className="rounded-[32px] border border-white/10 bg-slate-900" placeholderTitle="Image will appear here" placeholderHint="This media slot is currently empty." />
              {resolveText(block.alt, locale) ? <p className="text-center text-sm text-slate-400">{resolveText(block.alt, locale)}</p> : null}
            </div>
          );
        }

        if (block.type === 'video') {
          return (
            <div key={key} className="space-y-3">
              <DynamicMedia src={block.src} alt={resolveText(block.caption, locale)} className="rounded-[32px] border border-white/10 bg-slate-900" placeholderTitle="Video will appear here" placeholderHint="This video slot is currently empty." />
              {resolveText(block.caption, locale) ? <p className="text-center text-sm text-slate-400">{resolveText(block.caption, locale)}</p> : null}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
