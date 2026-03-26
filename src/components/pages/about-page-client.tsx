'use client';

import {BookOpenText, Briefcase, Check, GraduationCap, Mail, MapPin, Pencil, Phone, Plus, Sparkles, Terminal, Trash2, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useState} from 'react';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {formatPhoneHref} from '@/lib/contact';
import {useManagedProfile} from '@/lib/demo-store';
import type {Locale, Profile} from '@/lib/types';
import {resolveLocaleText} from '@/lib/utils';

/* ── Mini Toast ─────────────────────────────────────────────────────────── */
function SavedBadge() {
  return (
    <span className="toast-in inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
      <Check className="h-3 w-3" /> Saqlandi
    </span>
  );
}

/* ── Skill bar ──────────────────────────────────────────────────────────── */
const BAR_COLORS = ['bg-cyan-400','bg-violet-400','bg-emerald-400','bg-amber-400','bg-pink-400','bg-blue-400'];

function SkillBar({name, level, idx, isAdmin, onEdit, onRemove}: {
  name: string; level: number; idx: number;
  isAdmin: boolean;
  onEdit: (name: string, level: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tmpName, setTmpName] = useState(name);
  const [tmpLevel, setTmpLevel] = useState(level);
  const color = BAR_COLORS[idx % BAR_COLORS.length];

  if (editing) return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-3 space-y-2">
      <input value={tmpName} onChange={e => setTmpName(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Ko'nikma nomi" />
      <div className="flex items-center gap-3">
        <input type="range" min={0} max={100} value={tmpLevel} onChange={e => setTmpLevel(+e.target.value)} className="flex-1" />
        <span className="w-10 text-right text-xs text-slate-300">{tmpLevel}%</span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => { onEdit(tmpName, tmpLevel); setEditing(false); }}
          className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
          <Check className="h-3 w-3 inline mr-1" />Saqlash
        </button>
        <button type="button" onClick={() => setEditing(false)}
          className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
          Bekor
        </button>
      </div>
    </div>
  );

  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{level}%</span>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button type="button" onClick={() => { setTmpName(name); setTmpLevel(level); setEditing(true); }}
                className="cursor-pointer rounded-full p-1 text-slate-400 hover:text-cyan-300 transition"><Pencil className="h-3 w-3" /></button>
              <button type="button" onClick={onRemove}
                className="cursor-pointer rounded-full p-1 text-slate-400 hover:text-rose-300 transition"><Trash2 className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{background: 'var(--surface-3)'}}>
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{width: `${level}%`}} />
      </div>
    </div>
  );
}

/* ── DonutChart ─────────────────────────────────────────────────────────── */
function DonutChart() {
  const segs = [{l:'Frontend',p:35,c:'#22d3ee'},{l:'Backend',p:28,c:'#a78bfa'},{l:'AI / ML',p:22,c:'#34d399'},{l:'Tools',p:15,c:'#fbbf24'}];
  const r=52, cx=70, cy=70, circ=2*Math.PI*r;
  let acc=0;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {segs.map((s,i) => {
          const rot=(acc/100)*360-90; acc+=s.p;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth="16"
            strokeDasharray={`${(s.p/100)*circ} ${circ}`} transform={`rotate(${rot} ${cx} ${cy})`} strokeLinecap="butt"/>;
        })}
        <circle cx={cx} cy={cy} r={r-8} fill="var(--elevated)"/>
        <text x={cx} y={cy-4} textAnchor="middle" fill="var(--text-1)" fontSize="14" fontWeight="600">100%</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="var(--text-4)" fontSize="10">Stack</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {segs.map(s => (
          <div key={s.l} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{background: s.c}}/>
            <span className="text-xs text-slate-400">{s.l}</span>
            <span className="ml-auto text-xs font-semibold text-white">{s.p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function AboutPageClient({initialProfile}: {initialProfile: Profile}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('about');
  const common = useTranslations('common');
  const {isAdmin} = useDemoSession();
  const [profile, setProfile] = useManagedProfile(initialProfile);
  const [saved, setSaved] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalDraft, setPersonalDraft] = useState({
    name: profile.name, location: profile.location, email: profile.email, phone: profile.phone,
    availability: resolveLocaleText(profile.availability, locale),
    university: profile.university.name,
    degree: resolveLocaleText(profile.university.degree, locale),
  });
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(70);
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [newTimeline, setNewTimeline] = useState({year: String(new Date().getFullYear()), title: '', description: ''});

  const save = (updater: (p: Profile) => Partial<Profile>) => {
    setProfile(prev => ({...prev, ...updater(prev)}));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const techIcons: Record<string,string> = {frontend:'🎨',backend:'⚙️',ai:'🤖',tools:'🛠'};
  const phoneHref = formatPhoneHref(profile.phone);

  return (
    <>
      <PageHero title={t('title')} subtitle={t('subtitle')} eyebrow="ABOUT" />

      <section className="py-14 sm:py-18">
        <Container className="space-y-14">

          {/* ── Top row ──────────────────────────────────────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[400px_1fr]">

            {/* Profile card */}
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
                      style={{background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(168,85,247,0.2))'}}>
                      {profile.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    {editingPersonal ? (
                      <div className="flex-1 space-y-2 min-w-0">
                        <input value={personalDraft.name} onChange={e => setPersonalDraft(d => ({...d, name: e.target.value}))}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-lg font-semibold text-white outline-none" />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-1">{resolveLocaleText(profile.tagline, locale)}</p>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button type="button"
                      onClick={() => {
                        if (editingPersonal) {
                          save(() => ({
                            name: personalDraft.name,
                            location: personalDraft.location,
                            email: personalDraft.email,
                            phone: personalDraft.phone,
                            availability: personalDraft.availability,
                            university: {name: personalDraft.university, degree: personalDraft.degree}
                          }));
                          setEditingPersonal(false);
                        } else setEditingPersonal(true);
                      }}
                      className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${editingPersonal ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}>
                      {editingPersonal ? <><Check className="h-3 w-3 inline mr-1"/>Saqlash</> : <><Pencil className="h-3 w-3 inline mr-1"/>Tahrirlash</>}
                    </button>
                  )}
                </div>

                {editingPersonal ? (
                  <div className="space-y-2">
                    {[
                      {label:'Joylashuv', key:'location' as const, icon:MapPin},
                      {label:'Email', key:'email' as const, icon:Mail},
                      {label:'Telefon', key:'phone' as const, icon:Phone},
                      {label:'Universitet', key:'university' as const, icon:GraduationCap},
                      {label:'Daraja', key:'degree' as const, icon:BookOpenText},
                      {label:'Mavjudlik', key:'availability' as const, icon:Briefcase},
                    ].map(({label, key, icon: Icon}) => (
                      <div key={key}>
                        <label className="mb-1 block text-[11px] text-slate-500">{label}</label>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2">
                          <Icon className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                          <input value={personalDraft[key]}
                            onChange={e => setPersonalDraft(d => ({...d, [key]: e.target.value}))}
                            className="flex-1 bg-transparent text-sm text-white outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      {icon: MapPin, text: profile.location},
                      {icon: Mail, text: profile.email},
                      {icon: Phone, text: profile.phone},
                      {icon: GraduationCap, text: profile.university.name, sub: resolveLocaleText(profile.university.degree, locale)},
                      {icon: Briefcase, text: `${profile.experienceYears}+ yil`, sub: resolveLocaleText(profile.availability, locale)},
                    ].map(({icon: Icon, text, sub}) => (
                      <div key={text} className="flex items-start gap-2.5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                        <div>
                          <p className="text-sm font-medium text-white">{text}</p>
                          {sub ? <p className="mt-0.5 text-xs text-slate-400">{sub}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {profile.stats.map(stat => (
                  <div key={resolveLocaleText(stat.label,locale)} className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{resolveLocaleText(stat.label,locale)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills section */}
            <div className="space-y-5">
              {/* Skill bars */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Ko‘nikmalar</p>
                  <div className="flex items-center gap-2">
                    {saved && <SavedBadge />}
                    {isAdmin && (
                      <button type="button" onClick={() => setAddingSkill(a => !a)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                        <Plus className="h-3 w-3 inline mr-1" /> Qo‘shish
                      </button>
                    )}
                  </div>
                </div>

                {addingSkill && (
                  <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4 space-y-3">
                    <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Ko'nikma nomi"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={newSkillLevel} onChange={e => setNewSkillLevel(+e.target.value)} className="flex-1" />
                      <span className="w-10 text-right text-xs text-slate-300">{newSkillLevel}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        if (!newSkillName.trim()) return;
                        save(p => ({skillMetrics: [...p.skillMetrics, {name: newSkillName.trim(), level: newSkillLevel}]}));
                        setNewSkillName(''); setNewSkillLevel(70); setAddingSkill(false);
                      }} className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">Qo‘shish</button>
                      <button type="button" onClick={() => setAddingSkill(false)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">Bekor</button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {profile.skillMetrics.map((skill, idx) => (
                    <SkillBar key={skill.name} name={skill.name} level={skill.level} idx={idx} isAdmin={isAdmin}
                      onEdit={(name, level) => save(p => ({skillMetrics: p.skillMetrics.map((s,i) => i === idx ? {name, level} : s)}))}
                      onRemove={() => save(p => ({skillMetrics: p.skillMetrics.filter((_,i) => i !== idx)}))} />
                  ))}
                </div>
              </div>

              {/* Donut chart */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Stack taqsimoti</p>
                <DonutChart />
              </div>
            </div>
          </div>

          {/* ── Tech stack ──────────────────────────────────────────────── */}
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-cyan-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t('technologyTable')}</p>
              </div>
              <div className="flex-1 border-t border-white/5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {profile.techCategories.map(cat => (
                <div key={cat.key} className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-white/15">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xl">{techIcons[cat.key] ?? '💡'}</span>
                    <h3 className="text-sm font-semibold text-white">{resolveLocaleText(cat.title, locale)}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, ii) => (
                      <span key={item} className="group/tag inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[11px] text-slate-300">
                        {item}
                        {isAdmin && (
                          <button type="button"
                            onClick={() => save(p => ({techCategories: p.techCategories.map(c => c.key === cat.key ? {...c, items: c.items.filter((_,i)=>i!==ii)} : c)}))}
                            className="cursor-pointer ml-0.5 opacity-0 group-hover/tag:opacity-100 text-rose-400 transition hover:text-rose-300">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isAdmin && (
                      <button type="button"
                        onClick={() => {
                          const name = prompt(`${resolveLocaleText(cat.title, locale)} ga yangi texnologiya qo'shish:`);
                          if (name?.trim()) save(p => ({techCategories: p.techCategories.map(c => c.key === cat.key ? {...c, items: [...c.items, name.trim()]} : c)}));
                        }}
                        className="cursor-pointer rounded-full border border-dashed border-cyan-300/20 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-300/70 transition hover:border-cyan-300/40 hover:text-cyan-300">
                        <Plus className="h-3 w-3 inline" /> Qo‘shish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline ──────────────────────────────────────────────────── */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t('timeline')}</p>
                </div>
                <div className="flex-1 border-t border-white/5 min-w-[60px]" />
              </div>
              {isAdmin && (
                <button type="button" onClick={() => setAddingTimeline(a => !a)}
                  className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                  <Plus className="h-3 w-3 inline mr-1" /> Qo‘shish
                </button>
              )}
            </div>

            {addingTimeline && (
              <div className="mb-6 rounded-[24px] border border-cyan-300/20 bg-cyan-400/5 p-5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={newTimeline.year} onChange={e => setNewTimeline(d => ({...d, year: e.target.value}))}
                    className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Yil (masalan: 2023)" />
                  <input value={newTimeline.title} onChange={e => setNewTimeline(d => ({...d, title: e.target.value}))}
                    className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Sarlavha" />
                </div>
                <textarea value={newTimeline.description} onChange={e => setNewTimeline(d => ({...d, description: e.target.value}))}
                  className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Qisqacha tavsif..." />
                <div className="flex gap-2">
                  <button type="button" onClick={() => {
                    if (!newTimeline.title.trim()) return;
                    save(p => ({timeline: [{...newTimeline}, ...p.timeline]}));
                    setNewTimeline({year: String(new Date().getFullYear()), title: '', description: ''});
                    setAddingTimeline(false);
                  }} className="cursor-pointer rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300">Qo‘shish</button>
                  <button type="button" onClick={() => setAddingTimeline(false)}
                    className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">Bekor</button>
                </div>
              </div>
            )}

            <div className="relative space-y-0 pl-6">
              <div className="absolute left-[9px] top-0 h-full w-px" style={{background:'linear-gradient(to bottom, rgba(34,211,238,0.4), transparent)'}} />
              {profile.timeline.map((item, i) => (
                <div key={item.year + i} className="group relative pb-8 last:pb-0">
                  <div className="absolute -left-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-400/40" style={{background: 'var(--elevated)'}}>
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-white/15">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-white">{resolveLocaleText(item.title, locale)}</h3>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">{item.year}</span>
                        {isAdmin && (
                          <button type="button"
                            onClick={() => save(p => ({timeline: p.timeline.filter((_,ii) => ii !== i)}))}
                            className="cursor-pointer rounded-full p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-300">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{resolveLocaleText(item.description, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Contact CTA ──────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8">
            <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(circle at 70% 50%, rgba(34,211,238,0.07), transparent 60%)'}} />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{common('contact')}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{resolveLocaleText(profile.availability, locale)}</h3>
                <p className="mt-1 text-sm text-slate-400">{profile.location} · {profile.phone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={`mailto:${profile.email}`}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
                  <Mail className="h-4 w-4" /> {profile.email}
                </a>
                <a href={phoneHref}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                  style={{color:'var(--text-2)'}}>
                  <Phone className="h-4 w-4" /> {profile.phone}
                </a>
              </div>
            </div>
          </div>

        </Container>
      </section>
    </>
  );
}
