'use client';

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {BrainCircuit, Code2, DatabaseZap} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {ButtonLink} from '@/components/ui/button-link';
import {Container} from '@/components/ui/container';

const roleMeta = [
  {key: 'frontend', icon: Code2, stack: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS']},
  {key: 'backend', icon: DatabaseZap, stack: ['Node.js', 'Python', 'FastAPI', 'REST API', 'MongoDB', 'Auth']},
  {key: 'ai', icon: BrainCircuit, stack: ['Python', 'LLM Integration', 'Prompt Design', 'Automation', 'Data Pipelines']},
] as const;

export function HeroRoles() {
  const t = useTranslations('home');
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % roleMeta.length), 3800);
    return () => clearInterval(id);
  }, []);

  const current = useMemo(() => roleMeta[index], [index]);
  const Icon = current.icon;
  const heroHighlights = [
    t('heroHighlights.systems'),
    t('heroHighlights.product'),
    t('heroHighlights.automation'),
  ];
  const heroFacts = [
    {label: t('heroFactYear'), value: t('heroFactYearValue')},
    {label: t('heroFactStack'), value: t('heroFactStackValue')},
    {label: t('heroFactFocus'), value: t('heroFactFocusValue')},
  ];

  return (
    <section className="relative overflow-hidden" style={{borderBottom: '1px solid var(--border-1)'}}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 12% 42%, rgba(34,211,238,0.12), transparent 34%), radial-gradient(circle at 88% 26%, rgba(14,165,233,0.10), transparent 30%), radial-gradient(circle at 78% 76%, rgba(99,102,241,0.10), transparent 24%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{background: 'linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.12))'}}
      />
      <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: prefersReducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1]}}
          className="space-y-8"
        >
          <div className="space-y-5">
            <h1
              className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
              style={{color: 'var(--text-1)'}}
            >
              {t('title')}
            </h1>
            <p className="max-w-2xl text-base leading-8 sm:text-lg" style={{color: 'var(--text-3)'}}>
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portfolio">{t('ctaPrimary')}</ButtonLink>
            <ButtonLink href="/resume" variant="secondary">
              {t('ctaSecondary')}
            </ButtonLink>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {heroHighlights.map((item) => (
              <span
                key={item}
                className="rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {roleMeta.map((role, roleIndex) => (
              <button
                key={role.key}
                type="button"
                onClick={() => setIndex(roleIndex)}
                className="group cursor-pointer rounded-[22px] border px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: roleIndex === index ? 'rgba(34,211,238,0.4)' : 'var(--border-1)',
                  background: roleIndex === index ? 'linear-gradient(180deg, rgba(34,211,238,0.10), rgba(255,255,255,0.02))' : 'var(--surface-1)',
                  color: roleIndex === index ? 'var(--text-1)' : 'var(--text-3)',
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{color: 'var(--accent)'}}>
                  {t('rolePrefix')}
                </p>
                <p className="mt-2 text-sm font-semibold">{t(`roleTitles.${role.key}`)}</p>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, x: 18}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: prefersReducedMotion ? 0 : 0.55, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1]}}
          className="relative"
        >
          <div
            className="pointer-events-none absolute -left-6 top-10 hidden h-28 w-28 rounded-full blur-3xl sm:block"
            style={{background: 'rgba(34,211,238,0.16)'}}
          />
          <div
            className="pointer-events-none absolute -right-6 bottom-8 hidden h-24 w-24 rounded-full blur-3xl sm:block"
            style={{background: 'rgba(99,102,241,0.18)'}}
          />

          <div
            className="relative overflow-hidden rounded-[34px] border p-6 sm:p-7"
            style={{
              borderColor: 'var(--border-1)',
              background: 'linear-gradient(180deg, var(--elevated), var(--surface-1))',
              boxShadow: '0 30px 90px rgba(15,23,42,0.18)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{background: 'linear-gradient(135deg, rgba(34,211,238,0.10), transparent 40%, rgba(99,102,241,0.10))'}}
            />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px]" style={{background: 'var(--accent-m)'}}>
                  <Icon className="h-6 w-6" style={{color: 'var(--accent)'}} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{color: 'var(--accent)'}}>
                    {t('rolePrefix')}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={current.key}
                      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 8}}
                      animate={{opacity: 1, y: 0}}
                      exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: -8}}
                      transition={{duration: prefersReducedMotion ? 0 : 0.24}}
                      className="text-xl font-semibold"
                      style={{color: 'var(--text-1)'}}
                    >
                      {t(`roleTitles.${current.key}`)}
                    </motion.h2>
                  </AnimatePresence>
                </div>
              </div>
              <div
                className="hidden rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:inline-flex"
                style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-3)'}}
              >
                {t('spotlightTitle')}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.key}-body`}
                initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: -10}}
                transition={{duration: prefersReducedMotion ? 0 : 0.28}}
                className="relative"
              >
                <p className="mt-5 max-w-xl text-sm leading-7" style={{color: 'var(--text-3)'}}>
                  {t(`roleDescriptions.${current.key}`)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {current.stack.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{borderColor: 'var(--border-1)', color: 'var(--text-2)', background: 'var(--surface-1)'}}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 grid gap-3 rounded-[24px] border p-4 sm:grid-cols-3" style={{borderColor: 'var(--border-1)', background: 'var(--input-bg2)'}}>
              {heroFacts.map((fact) => (
                <div key={fact.label}>
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{color: 'var(--text-4)'}}>
                    {fact.label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold" style={{color: 'var(--text-1)'}}>
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
