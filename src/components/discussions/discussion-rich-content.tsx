'use client';

import {cn} from '@/lib/utils';

export function DiscussionRichContent({html, className}: {html: string; className?: string}) {
  return (
    <div
      className={cn(
        'blog-rich-content min-w-0 text-[15px] leading-7 sm:text-base',
        '[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-[22px] [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-slate-950/80 [&_pre]:p-4 sm:[&_pre]:p-5',
        '[&_pre_code]:break-normal [&_pre_code]:text-slate-200',
        '[&_blockquote]:my-5 [&_blockquote]:rounded-[22px] [&_blockquote]:bg-white/5 [&_blockquote]:px-4 [&_blockquote]:py-3 sm:[&_blockquote]:px-5',
        '[&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto',
        '[&_img]:my-5 [&_img]:rounded-[24px] [&_video]:my-5 [&_video]:rounded-[24px] [&_iframe]:my-5 [&_iframe]:min-h-[260px] [&_iframe]:w-full [&_iframe]:rounded-[24px] [&_iframe]:border [&_iframe]:border-white/10',
        '[&_ul]:space-y-2 [&_ol]:space-y-2',
        className
      )}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
