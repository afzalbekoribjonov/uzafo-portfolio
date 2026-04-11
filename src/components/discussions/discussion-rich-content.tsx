'use client';

import {cn} from '@/lib/utils';

export function DiscussionRichContent({html, className}: {html: string; className?: string}) {
  return (
    <div
      className={cn(
        'blog-rich-content min-w-0 text-sm',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-[20px] [&_pre]:bg-slate-950/80 [&_pre]:p-4',
        '[&_pre_code]:break-normal [&_pre_code]:text-slate-200',
        '[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto',
        '[&_img]:rounded-[20px] [&_video]:rounded-[20px] [&_iframe]:w-full',
        className
      )}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
