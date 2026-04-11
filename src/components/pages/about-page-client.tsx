'use client'

import {motion, useReducedMotion} from 'framer-motion'
import {BookOpenText, Briefcase, Check, GraduationCap, Mail, MapPin, Pencil, Phone, Plus, Sparkles, Terminal, Trash2, X} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'
import {type ReactNode, useState} from 'react'
import {Container} from '@/components/ui/container'
import {PageHero} from '@/components/ui/page-hero'
import {useDemoSession} from '@/lib/auth'
import {formatPhoneHref} from '@/lib/contact'
import {useManagedProfile} from '@/lib/demo-store'
import type {Locale, Profile} from '@/lib/types'
import {resolveLocaleText} from '@/lib/utils'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

function revealTransition(prefersReducedMotion: boolean | null, delay = 0, duration = 0.45) {
  const reduced = Boolean(prefersReducedMotion)
  return {
    duration: reduced ? 0 : duration,
    delay: reduced ? 0 : delay,
    ease: REVEAL_EASE,
  }
}

function AboutReveal({
  children,
  className,
  delay = 0,
  y = 22,
  x = 0,
  amount = 0.18,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  x?: number
  amount?: number
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y, x}}
      whileInView={prefersReducedMotion ? {opacity: 1} : {opacity: 1, y: 0, x: 0}}
      viewport={{once: true, amount}}
      transition={revealTransition(prefersReducedMotion, delay)}
    >
      {children}
    </motion.div>
  )
}

function SavedBadge() {
  return (
    <span className="toast-in inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
      <Check className="h-3 w-3" /> Saqlandi
    </span>
  )
}

const BAR_COLORS = ['bg-cyan-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400', 'bg-blue-400']

function SkillBar({
  name,
  level,
  idx,
  isAdmin,
  onEdit,
  onRemove,
}: {
  name: string
  level: number
  idx: number
  isAdmin: boolean
  onEdit: (name: string, level: number) => void
  onRemove: () => void
}) {
  const prefersReducedMotion = useReducedMotion()
  const [editing, setEditing] = useState(false)
  const [tmpName, setTmpName] = useState(name)
  const [tmpLevel, setTmpLevel] = useState(level)
  const color = BAR_COLORS[idx % BAR_COLORS.length]

  if (editing) {
    return (
      <motion.div
        initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        transition={revealTransition(prefersReducedMotion, 0, 0.2)}
        className="space-y-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-3"
      >
        <input value={tmpName} onChange={(e) => setTmpName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Ko'nikma nomi" />
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={100} value={tmpLevel} onChange={(e) => setTmpLevel(+e.target.value)} className="flex-1" />
          <span className="w-10 text-right text-xs text-slate-300">{tmpLevel}%</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { onEdit(tmpName, tmpLevel); setEditing(false) }} className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
            <Check className="mr-1 inline h-3 w-3" />Saqlash
          </button>
          <button type="button" onClick={() => setEditing(false)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
            Bekor
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="group"
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 12}}
      whileInView={prefersReducedMotion ? {opacity: 1} : {opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.7}}
      transition={revealTransition(prefersReducedMotion, 0.08 + idx * 0.06, 0.42)}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{level}%</span>
          {isAdmin ? (
            <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => { setTmpName(name); setTmpLevel(level); setEditing(true) }} className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:text-cyan-300"><Pencil className="h-3 w-3" /></button>
              <button type="button" onClick={onRemove} className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:text-rose-300"><Trash2 className="h-3 w-3" /></button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{background: 'var(--surface-3)'}}>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={prefersReducedMotion ? {width: `${level}%`} : {width: 0}}
          whileInView={{width: `${level}%`}}
          viewport={{once: true, amount: 0.8}}
          transition={revealTransition(prefersReducedMotion, 0.16 + idx * 0.06, 0.72)}
        />
      </div>
    </motion.div>
  )
}

function DonutChart() {
  const prefersReducedMotion = useReducedMotion()
  const segs = [
    {l: 'Frontend', p: 35, c: '#22d3ee'},
    {l: 'Backend', p: 28, c: '#a78bfa'},
    {l: 'AI / ML', p: 22, c: '#34d399'},
    {l: 'Tools', p: 15, c: '#fbbf24'},
  ]
  const r = 52
  const cx = 70
  const cy = 70
  const circ = 2 * Math.PI * r
  let acc = 0
  const segments = segs.map((segment) => {
    const dash = (segment.p / 100) * circ
    const offset = circ - (acc / 100) * circ
    acc += segment.p
    return {
      ...segment,
      dash,
      gap: circ - dash,
      offset,
    }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.svg width="140" height="140" viewBox="0 0 140 140" initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.94}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.65}} transition={revealTransition(prefersReducedMotion, 0.08, 0.4)}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16" />
        {segments.map((segment, index) => (
          <motion.circle
            key={segment.l}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={segment.c}
            strokeWidth="16"
            strokeDasharray={`${segment.dash} ${segment.gap}`}
            strokeDashoffset={segment.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
            initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
            whileInView={{opacity: 1}}
            viewport={{once: true, amount: 0.65}}
            transition={revealTransition(prefersReducedMotion, 0.16 + index * 0.08, 0.28)}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 8} fill="var(--elevated)" />
        <motion.text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-1)" fontSize="14" fontWeight="600" initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 8}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.65}} transition={revealTransition(prefersReducedMotion, 0.42, 0.3)}>100%</motion.text>
        <motion.text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-4)" fontSize="10" initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 8}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.65}} transition={revealTransition(prefersReducedMotion, 0.48, 0.3)}>Stack</motion.text>
      </motion.svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {segs.map((segment, index) => (
          <motion.div key={segment.l} className="flex items-center gap-2" initial={prefersReducedMotion ? {opacity: 1, x: 0} : {opacity: 0, x: index % 2 === 0 ? -10 : 10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true, amount: 0.65}} transition={revealTransition(prefersReducedMotion, 0.18 + index * 0.06, 0.32)}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{background: segment.c}} />
            <span className="text-xs text-slate-400">{segment.l}</span>
            <span className="ml-auto text-xs font-semibold text-white">{segment.p}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function AboutPageClient({initialProfile}: {initialProfile: Profile}) {
  const locale = useLocale() as Locale
  const t = useTranslations('about')
  const common = useTranslations('common')
  const {isAdmin} = useDemoSession()
  const prefersReducedMotion = useReducedMotion()
  const [profile, setProfile] = useManagedProfile(initialProfile)
  const [saved, setSaved] = useState(false)
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [personalDraft, setPersonalDraft] = useState({
    name: profile.name,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    availability: resolveLocaleText(profile.availability, locale),
    university: profile.university.name,
    degree: resolveLocaleText(profile.university.degree, locale),
  })
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(70)
  const [addingTimeline, setAddingTimeline] = useState(false)
  const [newTimeline, setNewTimeline] = useState({year: String(new Date().getFullYear()), title: '', description: ''})

  const save = (updater: (p: Profile) => Partial<Profile>) => {
    setProfile((prev) => ({...prev, ...updater(prev)}))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const techIcons: Record<string, string> = {frontend: '🎨', backend: '⚙️', ai: '🤖', tools: '🛠'}
  const phoneHref = formatPhoneHref(profile.phone)

  return (
    <>
      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="ABOUT" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-14">
          <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
            <AboutReveal className="space-y-4" delay={0.04} x={-18}>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <motion.div className="mb-4 flex items-start justify-between gap-3" initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 12}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.45}} transition={revealTransition(prefersReducedMotion, 0.08, 0.35)}>
                  <div className="flex items-start gap-3">
                    <motion.div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white" style={{background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(168,85,247,0.2))'}} initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.9}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.55}} transition={revealTransition(prefersReducedMotion, 0.12, 0.4)}>
                      {profile.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}
                    </motion.div>
                    {editingPersonal ? (
                      <div className="min-w-0 flex-1 space-y-2">
                        <input value={personalDraft.name} onChange={(e) => setPersonalDraft((draft) => ({...draft, name: e.target.value}))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-lg font-semibold text-white outline-none" />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-400">{resolveLocaleText(profile.tagline, locale)}</p>
                      </div>
                    )}
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPersonal) {
                          save(() => ({
                            name: personalDraft.name,
                            location: personalDraft.location,
                            email: personalDraft.email,
                            phone: personalDraft.phone,
                            availability: personalDraft.availability,
                            university: {name: personalDraft.university, degree: personalDraft.degree},
                          }))
                          setEditingPersonal(false)
                        } else {
                          setEditingPersonal(true)
                        }
                      }}
                      className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${editingPersonal ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                      {editingPersonal ? <><Check className="mr-1 inline h-3 w-3" />Saqlash</> : <><Pencil className="mr-1 inline h-3 w-3" />Tahrirlash</>}
                    </button>
                  ) : null}
                </motion.div>

                {editingPersonal ? (
                  <motion.div className="space-y-2" initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={revealTransition(prefersReducedMotion, 0.05, 0.22)}>
                    {[
                      {label: 'Joylashuv', key: 'location' as const, icon: MapPin},
                      {label: 'Email', key: 'email' as const, icon: Mail},
                      {label: 'Telefon', key: 'phone' as const, icon: Phone},
                      {label: 'Universitet', key: 'university' as const, icon: GraduationCap},
                      {label: 'Daraja', key: 'degree' as const, icon: BookOpenText},
                      {label: 'Mavjudlik', key: 'availability' as const, icon: Briefcase},
                    ].map(({label, key, icon: Icon}, index) => (
                      <motion.div key={key} initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={revealTransition(prefersReducedMotion, 0.03 + index * 0.03, 0.2)}>
                        <label className="mb-1 block text-[11px] text-slate-500">{label}</label>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                          <input value={personalDraft[key]} onChange={(e) => setPersonalDraft((draft) => ({...draft, [key]: e.target.value}))} className="flex-1 bg-transparent text-sm text-white outline-none" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {[
                      {icon: MapPin, text: profile.location},
                      {icon: Mail, text: profile.email},
                      {icon: Phone, text: profile.phone},
                      {icon: GraduationCap, text: profile.university.name, sub: resolveLocaleText(profile.university.degree, locale)},
                      {icon: Briefcase, text: `${profile.experienceYears}+ yil`, sub: resolveLocaleText(profile.availability, locale)},
                    ].map(({icon: Icon, text, sub}, index) => (
                      <motion.div key={text} className="flex items-start gap-2.5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3" initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 14}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.55}} transition={revealTransition(prefersReducedMotion, 0.1 + index * 0.05, 0.36)}>
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                        <div>
                          <p className="text-sm font-medium text-white">{text}</p>
                          {sub ? <p className="mt-0.5 text-xs text-slate-400">{sub}</p> : null}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {profile.stats.map((stat, index) => (
                  <motion.div key={resolveLocaleText(stat.label, locale)} className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-center" initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 14}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.7}} transition={revealTransition(prefersReducedMotion, 0.18 + index * 0.05, 0.36)}>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{resolveLocaleText(stat.label, locale)}</p>
                  </motion.div>
                ))}
              </div>
            </AboutReveal>

            <AboutReveal className="space-y-5" delay={0.1} x={18}>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <motion.div className="mb-5 flex items-center justify-between gap-3" initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.55}} transition={revealTransition(prefersReducedMotion, 0.08, 0.32)}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Ko‘nikmalar</p>
                  <div className="flex items-center gap-2">
                    {saved ? <SavedBadge /> : null}
                    {isAdmin ? (
                      <button type="button" onClick={() => setAddingSkill((active) => !active)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                        <Plus className="mr-1 inline h-3 w-3" /> Qo‘shish
                      </button>
                    ) : null}
                  </div>
                </motion.div>

                {addingSkill ? (
                  <motion.div className="mb-4 space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4" initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={revealTransition(prefersReducedMotion, 0.05, 0.2)}>
                    <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Ko'nikma nomi" className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={newSkillLevel} onChange={(e) => setNewSkillLevel(+e.target.value)} className="flex-1" />
                      <span className="w-10 text-right text-xs text-slate-300">{newSkillLevel}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSkillName.trim()) return
                          save((currentProfile) => ({skillMetrics: [...currentProfile.skillMetrics, {name: newSkillName.trim(), level: newSkillLevel}]}))
                          setNewSkillName('')
                          setNewSkillLevel(70)
                          setAddingSkill(false)
                        }}
                        className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Qo‘shish
                      </button>
                      <button type="button" onClick={() => setAddingSkill(false)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                        Bekor
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                <div className="space-y-4">
                  {profile.skillMetrics.map((skill, index) => (
                    <SkillBar
                      key={skill.name}
                      name={skill.name}
                      level={skill.level}
                      idx={index}
                      isAdmin={isAdmin}
                      onEdit={(name, level) => save((currentProfile) => ({skillMetrics: currentProfile.skillMetrics.map((item, skillIndex) => (skillIndex === index ? {name, level} : item))}))}
                      onRemove={() => save((currentProfile) => ({skillMetrics: currentProfile.skillMetrics.filter((_, skillIndex) => skillIndex !== index)}))}
                    />
                  ))}
                </div>
              </div>

              <motion.div className="rounded-[28px] border border-white/10 bg-white/5 p-6" initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 16}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.45}} transition={revealTransition(prefersReducedMotion, 0.18, 0.42)}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Stack taqsimoti</p>
                <DonutChart />
              </motion.div>
            </AboutReveal>
          </div>

          <AboutReveal delay={0.14}>
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-cyan-300" /><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t('technologyTable')}</p></div>
                <motion.div className="flex-1 border-t border-white/5" initial={prefersReducedMotion ? {opacity: 1, scaleX: 1} : {opacity: 0, scaleX: 0}} whileInView={{opacity: 1, scaleX: 1}} viewport={{once: true, amount: 0.7}} transition={revealTransition(prefersReducedMotion, 0.12, 0.48)} style={{transformOrigin: 'left center'}} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profile.techCategories.map((category, categoryIndex) => (
                  <motion.div key={category.key} className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-white/15" initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 18}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.28}} transition={revealTransition(prefersReducedMotion, 0.06 + categoryIndex * 0.05, 0.42)}>
                    <div className="mb-3 flex items-center gap-2">
                      <motion.span className="text-xl" initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.86}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.5}} transition={revealTransition(prefersReducedMotion, 0.1 + categoryIndex * 0.05, 0.35)}>
                        {techIcons[category.key] ?? '💡'}
                      </motion.span>
                      <h3 className="text-sm font-semibold text-white">{resolveLocaleText(category.title, locale)}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.items.map((item, itemIndex) => (
                        <motion.span key={item} className="group/tag inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[11px] text-slate-300" initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.9}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.4}} transition={revealTransition(prefersReducedMotion, 0.12 + categoryIndex * 0.04 + itemIndex * 0.03, 0.24)}>
                          {item}
                          {isAdmin ? (
                            <button type="button" onClick={() => save((currentProfile) => ({techCategories: currentProfile.techCategories.map((currentCategory) => (currentCategory.key === category.key ? {...currentCategory, items: currentCategory.items.filter((_, currentIndex) => currentIndex !== itemIndex)} : currentCategory))}))} className="ml-0.5 cursor-pointer text-rose-400 opacity-0 transition group-hover/tag:opacity-100 hover:text-rose-300">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          ) : null}
                        </motion.span>
                      ))}
                      {isAdmin ? (
                        <motion.button
                          type="button"
                          onClick={() => {
                            const name = prompt(`${resolveLocaleText(category.title, locale)} ga yangi texnologiya qo'shish:`)
                            if (name?.trim()) save((currentProfile) => ({techCategories: currentProfile.techCategories.map((currentCategory) => (currentCategory.key === category.key ? {...currentCategory, items: [...currentCategory.items, name.trim()]} : currentCategory))}))
                          }}
                          className="cursor-pointer rounded-full border border-dashed border-cyan-300/20 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-300/70 transition hover:border-cyan-300/40 hover:text-cyan-300"
                          initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.9}}
                          whileInView={{opacity: 1, scale: 1}}
                          viewport={{once: true, amount: 0.4}}
                          transition={revealTransition(prefersReducedMotion, 0.18 + categoryIndex * 0.04, 0.22)}
                        >
                          <Plus className="inline h-3 w-3" /> Qo‘shish
                        </motion.button>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AboutReveal>

          <AboutReveal delay={0.18}>
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t('timeline')}</p>
                  </div>
                  <motion.div
                    className="min-w-[60px] flex-1 border-t border-white/5"
                    initial={prefersReducedMotion ? {opacity: 1, scaleX: 1} : {opacity: 0, scaleX: 0}}
                    whileInView={{opacity: 1, scaleX: 1}}
                    viewport={{once: true, amount: 0.7}}
                    transition={revealTransition(prefersReducedMotion, 0.12, 0.48)}
                    style={{transformOrigin: 'left center'}}
                  />
                </div>
                {isAdmin ? (
                  <motion.button
                    type="button"
                    onClick={() => setAddingTimeline((active) => !active)}
                    className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
                    initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.6}}
                    transition={revealTransition(prefersReducedMotion, 0.16, 0.3)}
                  >
                    <Plus className="mr-1 inline h-3 w-3" /> Qo‘shish
                  </motion.button>
                ) : null}
              </div>

              {addingTimeline ? (
                <motion.div
                  className="mb-6 space-y-3 rounded-[24px] border border-cyan-300/20 bg-cyan-400/5 p-5"
                  initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 12}}
                  animate={{opacity: 1, y: 0}}
                  transition={revealTransition(prefersReducedMotion, 0.03, 0.22)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={newTimeline.year}
                      onChange={(e) => setNewTimeline((draft) => ({...draft, year: e.target.value}))}
                      className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Yil (masalan: 2023)"
                    />
                    <input
                      value={newTimeline.title}
                      onChange={(e) => setNewTimeline((draft) => ({...draft, title: e.target.value}))}
                      className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Sarlavha"
                    />
                  </div>
                  <textarea
                    value={newTimeline.description}
                    onChange={(e) => setNewTimeline((draft) => ({...draft, description: e.target.value}))}
                    className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Qisqacha tavsif..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newTimeline.title.trim()) return
                        save((currentProfile) => ({timeline: [{...newTimeline}, ...currentProfile.timeline]}))
                        setNewTimeline({year: String(new Date().getFullYear()), title: '', description: ''})
                        setAddingTimeline(false)
                      }}
                      className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Qo‘shish
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingTimeline(false)}
                      className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                      Bekor
                    </button>
                  </div>
                </motion.div>
              ) : null}

              <div className="relative space-y-0 pl-6">
                <motion.div
                  className="absolute left-[9px] top-0 h-full w-px"
                  style={{background: 'linear-gradient(to bottom, rgba(34,211,238,0.45), transparent)', transformOrigin: 'top center'}}
                  initial={prefersReducedMotion ? {opacity: 1, scaleY: 1} : {opacity: 0, scaleY: 0}}
                  whileInView={{opacity: 1, scaleY: 1}}
                  viewport={{once: true, amount: 0.2}}
                  transition={revealTransition(prefersReducedMotion, 0.08, 0.7)}
                />
                {profile.timeline.map((item, index) => (
                  <motion.div
                    key={item.year + index}
                    className="group relative pb-8 last:pb-0"
                    initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 22}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.35}}
                    transition={revealTransition(prefersReducedMotion, 0.08 + index * 0.06, 0.42)}
                  >
                    <motion.div
                      className="absolute -left-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-400/40"
                      style={{background: 'var(--elevated)'}}
                      initial={prefersReducedMotion ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.85}}
                      whileInView={{opacity: 1, scale: 1}}
                      viewport={{once: true, amount: 0.5}}
                      transition={revealTransition(prefersReducedMotion, 0.12 + index * 0.06, 0.28)}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                    </motion.div>
                    <motion.div
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-white/15"
                      initial={prefersReducedMotion ? {opacity: 1, x: 0} : {opacity: 0, x: 14}}
                      whileInView={{opacity: 1, x: 0}}
                      viewport={{once: true, amount: 0.45}}
                      transition={revealTransition(prefersReducedMotion, 0.14 + index * 0.06, 0.36)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{resolveLocaleText(item.title, locale)}</h3>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">{item.year}</span>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => save((currentProfile) => ({timeline: currentProfile.timeline.filter((_, timelineIndex) => timelineIndex !== index)}))}
                              className="cursor-pointer rounded-full p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{resolveLocaleText(item.description, locale)}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AboutReveal>

          <AboutReveal delay={0.22} y={26}>
            <motion.div
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8"
              initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 18}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.35}}
              transition={revealTransition(prefersReducedMotion, 0.04, 0.42)}
            >
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{background: 'radial-gradient(circle at 70% 50%, rgba(34,211,238,0.08), transparent 60%)'}}
                initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
                whileInView={{opacity: 1}}
                viewport={{once: true, amount: 0.35}}
                transition={revealTransition(prefersReducedMotion, 0.1, 0.55)}
              />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <motion.div
                  initial={prefersReducedMotion ? {opacity: 1, x: 0} : {opacity: 0, x: -18}}
                  whileInView={{opacity: 1, x: 0}}
                  viewport={{once: true, amount: 0.5}}
                  transition={revealTransition(prefersReducedMotion, 0.12, 0.38)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{common('contact')}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{resolveLocaleText(profile.availability, locale)}</h3>
                  <p className="mt-1 text-sm text-slate-400">{profile.location} · {profile.phone}</p>
                </motion.div>
                <motion.div
                  className="flex flex-wrap items-center gap-3"
                  initial={prefersReducedMotion ? {opacity: 1, x: 0} : {opacity: 0, x: 18}}
                  whileInView={{opacity: 1, x: 0}}
                  viewport={{once: true, amount: 0.5}}
                  transition={revealTransition(prefersReducedMotion, 0.18, 0.38)}
                >
                  <motion.a
                    href={`mailto:${profile.email}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                    initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.5}}
                    transition={revealTransition(prefersReducedMotion, 0.22, 0.3)}
                  >
                    <Mail className="h-4 w-4" /> {profile.email}
                  </motion.a>
                  <motion.a
                    href={phoneHref}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                    style={{color: 'var(--text-2)'}}
                    initial={prefersReducedMotion ? {opacity: 1, y: 0} : {opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.5}}
                    transition={revealTransition(prefersReducedMotion, 0.28, 0.3)}
                  >
                    <Phone className="h-4 w-4" /> {profile.phone}
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          </AboutReveal>
        </Container>
      </section>
    </>
  )
}
