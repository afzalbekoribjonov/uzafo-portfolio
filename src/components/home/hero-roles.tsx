'use client';

import {motion, AnimatePresence} from 'framer-motion';
import {ArrowRight, BrainCircuit, Code2, DatabaseZap} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';
import {ButtonLink} from '@/components/ui/button-link';
import {Container} from '@/components/ui/container';

const roleMeta = [
  {key: 'frontend', title: 'Frontend Developer', icon: Code2, stack: ['HTML','CSS','JavaScript','React','Next.js','Tailwind CSS']},
  {key: 'backend',  title: 'Backend Developer',  icon: DatabaseZap, stack: ['Node.js','Python','FastAPI','REST API','MongoDB','Auth']},
  {key: 'ai',       title: 'AI & ML Engineer',   icon: BrainCircuit, stack: ['Python','LLM Integration','Prompt Design','Automation','Data Pipelines']},
] as const;

export function HeroRoles() {
  const t = useTranslations('home');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % roleMeta.length), 3800);
    return () => clearInterval(id);
  }, []);

  const current = useMemo(() => roleMeta[index], [index]);
  const Icon = current.icon;

  return (
    <section className="relative overflow-hidden" style={{borderBottom: '1px solid var(--border-1)'}}>
      <div className="pointer-events-none absolute inset-0"
        style={{background:'radial-gradient(circle at 10% 50%, rgba(34,211,238,0.08),transparent 40%),radial-gradient(circle at 90% 50%, rgba(168,85,247,0.07),transparent 40%)'}} />
      <Container className="relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em]" style={{color:'var(--accent)'}}>
            {t('eyebrow')}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl" style={{color:'var(--text-1)'}} >
              {t('title')}
            </h1>
            <p className="max-w-2xl text-base leading-8 sm:text-lg" style={{color:'var(--text-3)'}}>{t('subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portfolio">{t('ctaPrimary')}</ButtonLink>
            <ButtonLink href="/resume" variant="secondary">{t('ctaSecondary')}</ButtonLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {roleMeta.map((role, i) => (
              <button key={role.key} type="button" onClick={() => setIndex(i)}
                className="cursor-pointer rounded-2xl border px-4 py-3.5 text-left transition"
                style={{
                  borderColor: i === index ? 'rgba(34,211,238,0.4)' : 'var(--border-1)',
                  background: i === index ? 'rgba(34,211,238,0.08)' : 'var(--surface-1)',
                  color: i === index ? 'var(--text-1)' : 'var(--text-3)',
                }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{color:'var(--accent)'}}>{t('rolePrefix')}</p>
                <p className="mt-2 text-sm font-semibold">{role.title}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[36px] blur-3xl"
            style={{background:'radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(168,85,247,0.08) 60%, transparent 100%)'}} />
          <AnimatePresence mode="wait">
            <motion.div key={current.key}
              initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}
              transition={{duration:0.3}}
              className="relative rounded-[28px] border p-6 backdrop-blur"
              style={{borderColor:'var(--border-1)', background:'var(--elevated)', boxShadow:'0 24px 80px rgba(0,0,0,0.3)'}}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{background:'var(--accent-m)'}}>
                  <Icon className="h-6 w-6" style={{color:'var(--accent)'}} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{color:'var(--accent)'}}>{t('rolePrefix')}</p>
                  <h2 className="text-xl font-semibold" style={{color:'var(--text-1)'}}>{current.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7" style={{color:'var(--text-3)'}}>{t(`roleDescriptions.${current.key}`)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {current.stack.map(item => (
                  <span key={item} className="rounded-full border border-white/10 px-3 py-1.5 text-xs" style={{color:'var(--text-2)', background:'var(--surface-2)'}}>
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid gap-3 rounded-[20px] border border-white/10 p-4 sm:grid-cols-3" style={{background:'var(--input-bg2)'}}>
                {[['Yil', '2026'], ['Stack', 'Next.js / Python'], ['Yo\'nalish', 'Product']].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-[0.2em]" style={{color:'var(--text-4)'}}>{label}</p>
                    <p className="mt-1.5 text-sm font-semibold" style={{color:'var(--text-1)'}}>{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
