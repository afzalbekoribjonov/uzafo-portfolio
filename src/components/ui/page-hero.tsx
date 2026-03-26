import type {ReactNode} from 'react';
import {Container} from '@/components/ui/container';
import {cn} from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHero({title, subtitle, eyebrow, actions, className}: PageHeroProps) {
  return (
    <section className={cn('relative overflow-hidden py-14 sm:py-18', className)}
      style={{borderBottom: '1px solid var(--border-1)'}}>
      <div className="pointer-events-none absolute inset-0"
        style={{background:'radial-gradient(circle at 65% 0%, rgba(34,211,238,0.09),transparent 45%),radial-gradient(circle at 10% 100%,rgba(168,85,247,0.07),transparent 45%)'}} />
      <Container className="relative">
        <div className="max-w-3xl space-y-4">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{color:'var(--accent)'}}>
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" style={{color:'var(--text-1)'}}>
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 sm:text-lg" style={{color:'var(--text-3)'}}>
            {subtitle}
          </p>
          {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
        </div>
      </Container>
    </section>
  );
}
