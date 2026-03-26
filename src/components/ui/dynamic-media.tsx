'use client';

import {Clapperboard, Image as ImageIcon} from 'lucide-react';
import {cn} from '@/lib/utils';

function isVideoSource(src: string) {
  const v = src.trim().toLowerCase();
  return v.startsWith('data:video') || /\.(mp4|webm|ogg|mov)(\?|#|$)/.test(v);
}

export function DynamicMedia({src, alt, className, mediaClassName, placeholderTitle, placeholderHint, controls = true, autoPlay = false, muted = true, loop = false}: {
  src?: string | null; alt: string; className?: string; mediaClassName?: string;
  placeholderTitle?: string; placeholderHint?: string;
  controls?: boolean; autoPlay?: boolean; muted?: boolean; loop?: boolean;
}) {
  const cleaned = src?.trim() ?? '';

  if (!cleaned) {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center p-6 text-center', className)}
        style={{background:'var(--input-bg2)', borderRadius: 'inherit'}}>
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <ImageIcon className="h-5 w-5" style={{color:'var(--text-4)'}} />
          </div>
          {placeholderTitle && <p className="text-sm font-medium" style={{color:'var(--text-2)'}}>{placeholderTitle}</p>}
          {placeholderHint && <p className="text-xs" style={{color:'var(--text-4)'}}>{placeholderHint}</p>}
        </div>
      </div>
    );
  }

  if (isVideoSource(cleaned)) {
    return (
      <div className={cn('overflow-hidden', className)} style={{background:'var(--input-bg2)'}}>
        <video src={cleaned} controls={controls} autoPlay={autoPlay} muted={muted} loop={loop} playsInline
          className={cn('h-full w-full object-cover', mediaClassName)}>
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden', className)} style={{background:'var(--input-bg2)'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cleaned} alt={alt} className={cn('h-full w-full object-cover', mediaClassName)} />
    </div>
  );
}

export function MediaTypeBadge({src}: {src?: string|null}) {
  const cleaned = src?.trim() ?? '';
  const isVideo = cleaned ? isVideoSource(cleaned) : false;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]"
      style={{color:'var(--text-3)'}}>
      {isVideo ? <Clapperboard className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
      {isVideo ? 'Video' : 'Media'}
    </span>
  );
}
