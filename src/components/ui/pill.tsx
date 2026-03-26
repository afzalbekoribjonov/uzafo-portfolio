import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface PillProps {
  children: ReactNode;
  className?: string;
}

export function Pill({children, className}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur',
        className
      )}
    >
      {children}
    </span>
  );
}
