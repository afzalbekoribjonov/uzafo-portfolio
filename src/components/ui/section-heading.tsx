import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface SectionHeadingProps {
  title: string; description?: string; badge?: string; action?: ReactNode; className?: string;
}

export function SectionHeading({title, description, badge, action, className}: SectionHeadingProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl space-y-1.5">
        {badge && <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{color:'var(--accent)'}}>{badge}</p>}
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{color:'var(--text-1)'}}>{title}</h2>
        {description && <p className="text-sm leading-6 sm:text-base" style={{color:'var(--text-3)'}}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
