import type {ReactNode} from 'react';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function ButtonLink({href, children, variant = 'primary', className}: ButtonLinkProps) {
  const styleMap = {
    primary: {background:'var(--accent)', color:'var(--accent-fg)'},
    secondary: {background:'var(--surface-1)', color:'var(--text-2)', border:'1px solid var(--border-1)'},
    ghost: {background:'transparent', color:'var(--text-3)'},
  };
  return (
    <Link href={href}
      className={cn('inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5', className)}
      style={styleMap[variant]}>
      {children}
    </Link>
  );
}
