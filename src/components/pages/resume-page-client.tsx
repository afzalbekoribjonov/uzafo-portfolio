'use client';

import {motion, useReducedMotion} from 'framer-motion';
import {
  ArrowDownToLine,
  BarChart3,
  Briefcase,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Route,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import type {ComponentType, ReactNode} from 'react';
import {useMemo, useState} from 'react';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {useManagedProfile, useManagedResume} from '@/lib/demo-store';
import type {Locale, Profile, ResumeAward, ResumeData, ResumeEducation, ResumeExperience, TextValue} from '@/lib/types';
import {cn, resolveText} from '@/lib/utils';

function updateTextValue(value: TextValue, locale: Locale, next: string): TextValue {
  if (typeof value === 'string') {
    return locale === 'uz'
      ? {uz: next, en: value}
      : {uz: value, en: next};
  }

  return {...value, [locale]: next};
}

function getLocalizedHighlights(highlights: Record<string, string[]>, locale: Locale) {
  return highlights[locale] ?? highlights.en ?? highlights.uz ?? Object.values(highlights)[0] ?? [];
}

function updateLocalizedHighlights(highlights: Record<string, string[]>, locale: Locale, next: string[]) {
  return {...highlights, [locale]: next};
}

function getSkillGroupLabel(key: string, locale: Locale) {
  const labels: Record<string, {uz: string; en: string}> = {
    frontend: {uz: 'Frontend', en: 'Frontend'},
    backend: {uz: 'Backend', en: 'Backend'},
    ai: {uz: 'AI & Automation', en: 'AI & Automation'},
    tools: {uz: 'Asboblar', en: 'Tools'},
  };

  return labels[key]?.[locale] ?? key;
}

function getRevealProps(reducedMotion: boolean, delay = 0) {
  return reducedMotion
    ? {
        initial: {opacity: 1, y: 0},
        whileInView: {opacity: 1, y: 0},
        viewport: {once: true, amount: 0.14},
      }
    : {
        initial: {opacity: 0, y: 28},
        whileInView: {opacity: 1, y: 0},
        viewport: {once: true, amount: 0.14},
        transition: {duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] as const},
      };
}

function Panel({
  title,
  eyebrow,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  icon: ComponentType<{className?: string}>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-[30px] border p-5 sm:p-6', className)}
      style={{borderColor: 'var(--border-1)', background: 'linear-gradient(180deg, var(--surface-1), var(--elevated))'}}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_32%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
            ) : null}
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl" style={{color: 'var(--text-1)'}}>
              {title}
            </h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-6" style={{color: 'var(--text-3)'}}>
                {description}
              </p>
            ) : null}
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

const fieldClassName =
  'w-full rounded-[18px] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm outline-none transition focus:border-cyan-300/35';

const secondaryFieldClassName =
  'w-full rounded-2xl border border-white/10 bg-slate-950/75 px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-300/35';

export function ResumePageClient({initialProfile, initialResume, resumePdf}: {
  initialProfile: Profile; initialResume: ResumeData; resumePdf: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('resume');
  const common = useTranslations('common');
  const about = useTranslations('about');
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [profile] = useManagedProfile(initialProfile);
  const [resume, setResume] = useManagedResume(initialResume);
  const {isAdmin} = useDemoSession();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1');
  const [draft, setDraft] = useState<ResumeData>(initialResume);
  const isEditing = isAdmin && editing;

  const saveDraft = () => { setResume(draft); setEditing(false); };
  const cancelDraft = () => { setDraft(resume); setEditing(false); };
  const copy = useMemo(
    () => locale === 'uz'
      ? {
          heroBadge: 'Product-ready resume',
          quickFacts: 'Tezkor faktlar',
          contact: 'Bog‘lanish',
          skillLevels: 'Ko‘nikma darajalari',
          stackGroups: 'Texnologiya bloklari',
          currentFocus: 'Hozirgi fokus',
          roadmap: 'O‘sish yo‘li',
          focusHint: 'Asosiy e’tibor product-grade web ilovalar, admin sistemalar va AI integratsiyalarga qaratilgan.',
          addExperience: 'Tajriba qo‘shish',
          addHighlight: 'Punkt qo‘shish',
          addEducation: 'Ta’lim qo‘shish',
          addAward: 'Yutuq qo‘shish',
          remove: 'O‘chirish',
          years: 'yil',
        }
      : {
          heroBadge: 'Product-ready resume',
          quickFacts: 'Quick facts',
          contact: 'Contact',
          skillLevels: 'Skill levels',
          stackGroups: 'Stack groups',
          currentFocus: 'Current focus',
          roadmap: 'Growth path',
          focusHint: 'Current focus is on product-grade web apps, admin systems, and AI-integrated developer workflows.',
          addExperience: 'Add experience',
          addHighlight: 'Add point',
          addEducation: 'Add education',
          addAward: 'Add highlight',
          remove: 'Remove',
          years: 'years',
        },
    [locale]
  );

  const heroStats = useMemo(
    () => profile.stats.slice(0, 4).map((stat) => ({
      label: resolveText(stat.label, locale),
      value: stat.value,
    })),
    [locale, profile.stats]
  );

  const quickFacts = useMemo(
    () => [
      {label: t('experience'), value: `${draft.experience.length}`},
      {label: t('education'), value: `${draft.education.length}`},
      {label: t('awards'), value: `${draft.awards.length}`},
      {label: locale === 'uz' ? 'Tajriba davri' : 'Experience span', value: `${profile.experienceYears}+ ${copy.years}`},
    ],
    [copy.years, draft.awards.length, draft.education.length, draft.experience.length, locale, profile.experienceYears, t]
  );

  const focusItems = useMemo(
    () => profile.techCategories.flatMap((category) => category.items).slice(0, 10),
    [profile.techCategories]
  );

  const updateExperience = (index: number, updater: (current: ResumeExperience) => ResumeExperience) => {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) => itemIndex === index ? updater(item) : item),
    }));
  };

  const updateEducation = (index: number, updater: (current: ResumeEducation) => ResumeEducation) => {
    setDraft((current) => ({
      ...current,
      education: current.education.map((item, itemIndex) => itemIndex === index ? updater(item) : item),
    }));
  };

  const updateAward = (index: number, updater: (current: ResumeAward) => ResumeAward) => {
    setDraft((current) => ({
      ...current,
      awards: current.awards.map((item, itemIndex) => itemIndex === index ? updater(item) : item),
    }));
  };

  return (
    <>
      <PageHero
        title={t('title')}
        subtitle={t('subtitle')}
        eyebrow="RESUME"
        actions={
          resumePdf ? (
            <a
              href={resumePdf}
              download
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
            >
              <ArrowDownToLine className="h-4 w-4" />
              {common('downloadPdf')}
            </a>
          ) : undefined
        }
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6 sm:space-y-8">
          {isAdmin ? (
            <AdminInlineBar editing={isEditing} onToggle={() => setEditing((value) => !value)} onSave={saveDraft} onCancel={cancelDraft} />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_360px]">
            <motion.div {...getRevealProps(prefersReducedMotion, 0.02)}>
              <div
                className="relative overflow-hidden rounded-[34px] border p-6 sm:p-8 lg:p-10"
                style={{borderColor: 'var(--border-1)', background: 'linear-gradient(145deg, var(--surface-1), var(--elevated))'}}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_28%)]" />
                <div className="relative space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                        {copy.heroBadge}
                      </span>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.02]" style={{color: 'var(--text-1)'}}>
                          {profile.name}
                        </h2>
                        {isEditing ? (
                          <textarea
                            value={resolveText(draft.headline, locale)}
                            onChange={(event) => setDraft((current) => ({...current, headline: updateTextValue(current.headline, locale, event.target.value)}))}
                            className={cn(fieldClassName, 'min-h-[108px] resize-none')}
                            style={{color: 'var(--text-2)'}}
                          />
                        ) : (
                          <p className="max-w-3xl text-base leading-7 sm:text-lg" style={{color: 'var(--text-2)'}}>
                            {resolveText(draft.headline, locale)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid min-w-[180px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {quickFacts.map((fact) => (
                        <div key={fact.label} className="rounded-[22px] border p-4" style={{borderColor: 'var(--border-1)', background: 'rgba(255,255,255,0.04)'}}>
                          <p className="text-[11px] uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                            {fact.label}
                          </p>
                          <p className="mt-2 text-xl font-semibold" style={{color: 'var(--text-1)'}}>
                            {fact.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={resolveText(draft.summary, locale)}
                      onChange={(event) => setDraft((current) => ({...current, summary: updateTextValue(current.summary, locale, event.target.value)}))}
                      className={cn(fieldClassName, 'min-h-[148px] resize-none')}
                      style={{color: 'var(--text-3)'}}
                    />
                  ) : (
                    <p className="max-w-4xl text-sm leading-8 sm:text-[15px]" style={{color: 'var(--text-3)'}}>
                      {resolveText(draft.summary, locale)}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {heroStats.map((stat, index) => (
                      <motion.div key={`${stat.label}-${index}`} {...getRevealProps(prefersReducedMotion, 0.05 + index * 0.04)} className="rounded-[22px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                        <p className="text-[11px] uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                          {stat.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold" style={{color: 'var(--text-1)'}}>
                          {stat.value}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition hover:-translate-y-0.5" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}>
                      <Mail className="h-4 w-4 text-cyan-300" />
                      {profile.email}
                    </a>
                    {profile.phone ? (
                      <a href={`tel:${profile.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition hover:-translate-y-0.5" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}>
                        <Phone className="h-4 w-4 text-cyan-300" />
                        {profile.phone}
                      </a>
                    ) : null}
                    <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-2)'}}>
                      <MapPin className="h-4 w-4 text-cyan-300" />
                      {profile.location}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div {...getRevealProps(prefersReducedMotion, 0.08)}>
              <Panel title={copy.quickFacts} eyebrow={copy.currentFocus} description={copy.focusHint} icon={Sparkles}>
                <div className="space-y-4">
                  <div className="rounded-[22px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                    <p className="text-[11px] uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                      {copy.contact}
                    </p>
                    <div className="mt-3 space-y-2.5 text-sm" style={{color: 'var(--text-2)'}}>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-300" /><span>{profile.email}</span></div>
                      {profile.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-cyan-300" /><span>{profile.phone}</span></div> : null}
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-300" /><span>{profile.location}</span></div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                    <p className="text-[11px] uppercase tracking-[0.22em]" style={{color: 'var(--text-4)'}}>
                      {t('education')}
                    </p>
                    <p className="mt-2 text-base font-semibold" style={{color: 'var(--text-1)'}}>
                      {profile.university.name}
                    </p>
                    <p className="mt-1 text-sm" style={{color: 'var(--text-3)'}}>
                      {resolveText(profile.university.degree, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {focusItems.map((item) => (
                      <span key={item} className="rounded-full border px-3 py-1.5 text-xs" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-3)'}}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Panel>
            </motion.div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_360px]">
            <motion.div {...getRevealProps(prefersReducedMotion, 0.04)}>
              <Panel title={t('experience')} eyebrow={copy.heroBadge} description={locale === 'uz' ? 'Har bir rol mahsulot fikrlashi, tizim arxitekturasi va foydalanuvchi oqimlarini yaxshilashga qaratilgan.' : 'Each role is shaped around product thinking, system architecture, and better end-user flows.'} icon={Briefcase}>
                <div className="space-y-4">
                  {draft.experience.map((exp, index) => {
                    const highlights = getLocalizedHighlights(exp.highlights, locale);

                    return (
                      <motion.div key={`${exp.company}-${index}`} {...getRevealProps(prefersReducedMotion, 0.06 + index * 0.03)} className="relative overflow-hidden rounded-[26px] border p-5 sm:p-6" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                        <div className="absolute inset-y-5 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-sky-500" />
                        {isEditing ? (
                          <div className="space-y-3 pl-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                <input value={exp.company} onChange={(event) => updateExperience(index, (current) => ({...current, company: event.target.value}))} className={secondaryFieldClassName} style={{color: 'var(--text-1)'}} placeholder={locale === 'uz' ? 'Kompaniya' : 'Company'} />
                                <input value={exp.period} onChange={(event) => updateExperience(index, (current) => ({...current, period: event.target.value}))} className={secondaryFieldClassName} style={{color: 'var(--text-2)'}} placeholder="2024 - Present" />
                              </div>
                              <button type="button" onClick={() => setDraft((current) => ({...current, experience: current.experience.filter((_, itemIndex) => itemIndex !== index)}))} className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20">
                                <Trash2 className="h-3.5 w-3.5" />
                                {copy.remove}
                              </button>
                            </div>

                            <input value={resolveText(exp.role, locale)} onChange={(event) => updateExperience(index, (current) => ({...current, role: updateTextValue(current.role, locale, event.target.value)}))} className={secondaryFieldClassName} style={{color: 'var(--accent)'}} placeholder={locale === 'uz' ? 'Lavozim' : 'Role'} />

                            <div className="space-y-2.5">
                              {highlights.map((highlight, highlightIndex) => (
                                <div key={`${highlightIndex}-${highlight}`} className="flex items-start gap-2">
                                  <textarea value={highlight} onChange={(event) => updateExperience(index, (current) => ({...current, highlights: updateLocalizedHighlights(current.highlights, locale, getLocalizedHighlights(current.highlights, locale).map((item, itemIndex) => itemIndex === highlightIndex ? event.target.value : item))}))} className={cn(secondaryFieldClassName, 'min-h-[78px] resize-none')} style={{color: 'var(--text-2)'}} />
                                  <button type="button" onClick={() => updateExperience(index, (current) => ({...current, highlights: updateLocalizedHighlights(current.highlights, locale, getLocalizedHighlights(current.highlights, locale).filter((_, itemIndex) => itemIndex !== highlightIndex))}))} className="mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button type="button" onClick={() => updateExperience(index, (current) => ({...current, highlights: updateLocalizedHighlights(current.highlights, locale, [...getLocalizedHighlights(current.highlights, locale), ''])}))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium transition hover:bg-white/10" style={{color: 'var(--text-3)'}}>
                                <Plus className="h-3.5 w-3.5" />
                                {copy.addHighlight}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pl-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-lg font-semibold" style={{color: 'var(--text-1)'}}>{exp.company}</h3>
                                <p className="mt-1 text-sm font-medium text-cyan-300">{resolveText(exp.role, locale)}</p>
                              </div>
                              <span className="rounded-full border px-3 py-1 text-xs" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--text-3)'}}>
                                {exp.period}
                              </span>
                            </div>
                            <ul className="mt-4 space-y-2.5">
                              {highlights.map((highlight) => (
                                <li key={highlight} className="flex items-start gap-3 text-sm leading-7" style={{color: 'var(--text-3)'}}>
                                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {isEditing ? (
                    <button type="button" onClick={() => setDraft((current) => ({...current, experience: [...current.experience, {company: locale === 'uz' ? 'Yangi kompaniya' : 'New company', role: {uz: 'Lavozim', en: 'Role'}, period: '2026', highlights: {uz: ['Yangi yo‘nalish'], en: ['New responsibility']}}]}))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10" style={{color: 'var(--text-2)'}}>
                      <Plus className="h-4 w-4" />
                      {copy.addExperience}
                    </button>
                  ) : null}
                </div>
              </Panel>
            </motion.div>

            <div className="space-y-6">
              <motion.div {...getRevealProps(prefersReducedMotion, 0.08)}>
                <Panel title={copy.skillLevels} eyebrow={common('skills')} description={locale === 'uz' ? 'Asosiy yo‘nalishlar bo‘yicha amaliy kuchli tomonlar.' : 'Practical strengths across the main delivery areas.'} icon={BarChart3}>
                  <div className="space-y-4">
                    {profile.skillMetrics.map((skill, index) => (
                      <motion.div key={skill.name} {...getRevealProps(prefersReducedMotion, 0.1 + index * 0.03)}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span style={{color: 'var(--text-2)'}}>{skill.name}</span>
                          <span className="font-semibold text-cyan-300">{skill.level}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{background: 'var(--surface-3)'}}>
                          <motion.div
                            initial={prefersReducedMotion ? {width: `${skill.level}%`} : {width: 0}}
                            whileInView={{width: `${skill.level}%`}}
                            viewport={{once: true, amount: 0.7}}
                            transition={{duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.12 + index * 0.04}}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              </motion.div>

              <motion.div {...getRevealProps(prefersReducedMotion, 0.12)}>
                <Panel title={copy.roadmap} eyebrow={about('timeline')} description={locale === 'uz' ? 'Yildan-yilga kuchayib borayotgan asosiy yo‘nalishlar.' : 'The key directions that have grown stronger year by year.'} icon={Route}>
                  <div className="space-y-4">
                    {profile.timeline.map((item, index) => (
                      <motion.div key={`${item.year}-${index}`} {...getRevealProps(prefersReducedMotion, 0.14 + index * 0.03)} className="rounded-[22px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            {item.year}
                          </span>
                          <p className="font-semibold" style={{color: 'var(--text-1)'}}>{resolveText(item.title, locale)}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6" style={{color: 'var(--text-3)'}}>{resolveText(item.description, locale)}</p>
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              </motion.div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
            <motion.div {...getRevealProps(prefersReducedMotion, 0.06)}>
              <Panel title={copy.stackGroups} eyebrow={common('skills')} description={locale === 'uz' ? 'Resume ichidagi asosiy stack bloklari bir qarashda o‘qiladigan tarzda tartiblandi.' : 'The core stack is grouped so the page remains easy to scan.'} icon={Layers3}>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(draft.skills).map(([key, values], index) => (
                    <motion.div key={key} {...getRevealProps(prefersReducedMotion, 0.08 + index * 0.03)} className="rounded-[24px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">{getSkillGroupLabel(key, locale)}</p>
                      {isEditing ? (
                        <textarea
                          value={values.join(', ')}
                          onChange={(event) => setDraft((current) => ({...current, skills: {...current.skills, [key]: event.target.value.split(',').map((item) => item.trim()).filter(Boolean)}}))}
                          className={cn(fieldClassName, 'mt-3 min-h-[120px] resize-none')}
                          style={{color: 'var(--text-2)'}}
                        />
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {values.map((value) => (
                            <span key={value} className="rounded-full border px-3 py-1.5 text-xs" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--text-3)'}}>
                              {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Panel>
            </motion.div>

            <div className="space-y-6">
              <motion.div {...getRevealProps(prefersReducedMotion, 0.1)}>
                <Panel title={t('education')} eyebrow={profile.university.name} description={locale === 'uz' ? 'Ta’lim qismi amaliy yo‘nalish va davom etayotgan o‘sishni ko‘rsatadi.' : 'Education stays concise while still showing direction and growth.'} icon={GraduationCap}>
                  <div className="space-y-4">
                    {draft.education.map((edu, index) => (
                      <motion.div key={`${edu.institution}-${index}`} {...getRevealProps(prefersReducedMotion, 0.12 + index * 0.03)} className="rounded-[24px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex justify-end">
                              <button type="button" onClick={() => setDraft((current) => ({...current, education: current.education.filter((_, itemIndex) => itemIndex !== index)}))} className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20">
                                <Trash2 className="h-3.5 w-3.5" />
                                {copy.remove}
                              </button>
                            </div>
                            <input value={edu.institution} onChange={(event) => updateEducation(index, (current) => ({...current, institution: event.target.value}))} className={secondaryFieldClassName} style={{color: 'var(--text-1)'}} placeholder={locale === 'uz' ? 'Muassasa' : 'Institution'} />
                            <input value={resolveText(edu.degree, locale)} onChange={(event) => updateEducation(index, (current) => ({...current, degree: updateTextValue(current.degree, locale, event.target.value)}))} className={secondaryFieldClassName} style={{color: 'var(--text-2)'}} placeholder={locale === 'uz' ? 'Daraja' : 'Degree'} />
                            <input value={edu.period} onChange={(event) => updateEducation(index, (current) => ({...current, period: event.target.value}))} className={secondaryFieldClassName} style={{color: 'var(--text-3)'}} placeholder="2020 - 2024" />
                          </div>
                        ) : (
                          <>
                            <p className="text-base font-semibold" style={{color: 'var(--text-1)'}}>{edu.institution}</p>
                            <p className="mt-1.5 text-sm" style={{color: 'var(--text-3)'}}>{resolveText(edu.degree, locale)}</p>
                            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{edu.period}</p>
                          </>
                        )}
                      </motion.div>
                    ))}

                    {isEditing ? (
                      <button type="button" onClick={() => setDraft((current) => ({...current, education: [...current.education, {institution: locale === 'uz' ? 'Yangi muassasa' : 'New institution', degree: {uz: 'Yo‘nalish', en: 'Program'}, period: '2026'}]}))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10" style={{color: 'var(--text-2)'}}>
                        <Plus className="h-4 w-4" />
                        {copy.addEducation}
                      </button>
                    ) : null}
                  </div>
                </Panel>
              </motion.div>

              <motion.div {...getRevealProps(prefersReducedMotion, 0.12)}>
                <Panel title={t('awards')} eyebrow="Impact" description={locale === 'uz' ? 'Formal mukofotlardan tashqari amaliy natija va ishonchli yo‘nalishlarni ham ko‘rsatadi.' : 'Captures practical wins and trust signals, not just formal awards.'} icon={Trophy}>
                  <div className="space-y-4">
                    {draft.awards.map((award, index) => (
                      <motion.div key={`${resolveText(award.title, locale)}-${index}`} {...getRevealProps(prefersReducedMotion, 0.14 + index * 0.03)} className="rounded-[24px] border p-4" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex justify-end">
                              <button type="button" onClick={() => setDraft((current) => ({...current, awards: current.awards.filter((_, itemIndex) => itemIndex !== index)}))} className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20">
                                <Trash2 className="h-3.5 w-3.5" />
                                {copy.remove}
                              </button>
                            </div>
                            <input value={resolveText(award.title, locale)} onChange={(event) => updateAward(index, (current) => ({...current, title: updateTextValue(current.title, locale, event.target.value)}))} className={secondaryFieldClassName} style={{color: 'var(--text-1)'}} placeholder={locale === 'uz' ? 'Sarlavha' : 'Title'} />
                            <textarea value={resolveText(award.description, locale)} onChange={(event) => updateAward(index, (current) => ({...current, description: updateTextValue(current.description, locale, event.target.value)}))} className={cn(fieldClassName, 'min-h-[96px] resize-none')} style={{color: 'var(--text-3)'}} placeholder={locale === 'uz' ? 'Tavsif' : 'Description'} />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
                                <Trophy className="h-4.5 w-4.5" />
                              </span>
                              <p className="text-base font-semibold" style={{color: 'var(--text-1)'}}>{resolveText(award.title, locale)}</p>
                            </div>
                            <p className="mt-3 text-sm leading-6" style={{color: 'var(--text-3)'}}>{resolveText(award.description, locale)}</p>
                          </>
                        )}
                      </motion.div>
                    ))}

                    {isEditing ? (
                      <button type="button" onClick={() => setDraft((current) => ({...current, awards: [...current.awards, {title: {uz: 'Yangi yutuq', en: 'New highlight'}, description: {uz: 'Tavsif kiriting', en: 'Add a short description'}}]}))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10" style={{color: 'var(--text-2)'}}>
                        <Plus className="h-4 w-4" />
                        {copy.addAward}
                      </button>
                    ) : null}
                  </div>
                </Panel>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
