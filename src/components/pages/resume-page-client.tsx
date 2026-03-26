'use client';

import {ArrowDownToLine, Plus, Trash2} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {AdminInlineBar} from '@/components/ui/admin-inline-bar';
import {Container} from '@/components/ui/container';
import {PageHero} from '@/components/ui/page-hero';
import {useDemoSession} from '@/lib/auth';
import {useManagedProfile, useManagedResume} from '@/lib/demo-store';
import type {Profile, ResumeData} from '@/lib/types';
import {resolveText} from '@/lib/utils';

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
      <h2 className="text-lg font-semibold" style={{color:'var(--text-1)'}}>{title}</h2>
      {children}
    </div>
  );
}

export function ResumePageClient({initialProfile, initialResume, resumePdf}: {
  initialProfile: Profile; initialResume: ResumeData; resumePdf: string;
}) {
  const [profile] = useManagedProfile(initialProfile);
  const [resume, setResume] = useManagedResume(initialResume);
  const {isAdmin} = useDemoSession();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeData>(resume);

  useEffect(() => setDraft(resume), [resume]);
  useEffect(() => { if (isAdmin && searchParams.get('edit') === '1') setEditing(true); }, [isAdmin, searchParams]);

  const saveDraft = () => { setResume(draft); setEditing(false); };
  const cancelDraft = () => { setDraft(resume); setEditing(false); };

  return (
    <>
      <PageHero title="Resume" subtitle="Professional resume with live editing for admin." eyebrow="RESUME" />
      <section className="py-14 sm:py-18">
        <Container className="space-y-8">
          {isAdmin && <AdminInlineBar editing={editing} onToggle={() => setEditing(v => !v)} onSave={saveDraft} onCancel={cancelDraft} />}

          {/* Header card */}
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold" style={{color:'var(--text-1)'}}>{profile.name}</h1>
                {editing ? (
                  <textarea value={resolveText(draft.headline,'en')} onChange={e => setDraft({...draft, headline: e.target.value})}
                    className="mt-2 min-h-20 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none" style={{color:'var(--text-2)'}} />
                ) : (
                  <p className="mt-2 text-base" style={{color:'var(--text-3)'}}>{resolveText(resume.headline,'en')}</p>
                )}
              </div>
              <a href={resumePdf} download
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
                <ArrowDownToLine className="h-4 w-4" /> PDF yuklash
              </a>
            </div>
            {editing ? (
              <textarea value={resolveText(draft.summary,'en')} onChange={e => setDraft({...draft, summary: e.target.value})}
                className="mt-4 min-h-28 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none" style={{color:'var(--text-2)'}} />
            ) : (
              <p className="mt-4 text-sm leading-7" style={{color:'var(--text-3)'}}>{resolveText(resume.summary,'en')}</p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Experience */}
            <Section title="Tajriba">
              {draft.experience.map((exp, ei) => (
                <div key={ei} className="rounded-[20px] border border-white/10 p-5" style={{background:'var(--input-bg2)'}}>
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input value={exp.company} onChange={e => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, company: e.target.value} : r)})}
                          className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-1)'}} placeholder="Kompaniya" />
                        <input value={exp.period} onChange={e => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, period: e.target.value} : r)})}
                          className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-1)'}} placeholder="2022–hozir" />
                      </div>
                      <input value={resolveText(exp.role,'en')} onChange={e => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, role: e.target.value} : r)})}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--accent)'}} placeholder="Lavozim" />
                      <div className="space-y-2">
                        {exp.highlights.en.map((h,hi) => (
                          <div key={hi} className="flex items-center gap-2">
                            <input value={h} onChange={e => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, highlights:{...r.highlights, en: r.highlights.en.map((p,j) => j===hi ? e.target.value : p)}} : r)})}
                              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-2)'}} />
                            <button type="button" onClick={() => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, highlights:{...r.highlights, en: r.highlights.en.filter((_,j) => j!==hi)}} : r)})}
                              className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 p-1.5 transition hover:bg-rose-500/20" style={{color:'var(--danger)'}}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setDraft({...draft, experience: draft.experience.map((r,i) => i===ei ? {...r, highlights:{...r.highlights, en:[...r.highlights.en,'']}} : r)})}
                          className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs transition hover:bg-white/10" style={{color:'var(--text-3)'}}>
                          <Plus className="h-3 w-3 inline mr-1"/>Qo'shish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold" style={{color:'var(--text-1)'}}>{exp.company}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs" style={{color:'var(--text-3)'}}>{exp.period}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium" style={{color:'var(--accent)'}}>{resolveText(exp.role,'en')}</p>
                      <ul className="mt-3 space-y-1.5">
                        {exp.highlights.en.map(h => (
                          <li key={h} className="flex items-start gap-2 text-sm" style={{color:'var(--text-3)'}}>
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{background:'var(--accent)'}} />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </Section>

            <div className="space-y-6">
              {/* Education */}
              <Section title="Ta'lim">
                {draft.education.map((edu, ei) => (
                  <div key={ei} className="rounded-[20px] border border-white/10 p-4" style={{background:'var(--input-bg2)'}}>
                    {editing ? (
                      <div className="space-y-2">
                        <input value={edu.institution} onChange={e => setDraft({...draft, education: draft.education.map((r,i) => i===ei ? {...r, institution: e.target.value} : r)})}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-1)'}} placeholder="Muassasa" />
                        <input value={resolveText(edu.degree,'en')} onChange={e => setDraft({...draft, education: draft.education.map((r,i) => i===ei ? {...r, degree: e.target.value} : r)})}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-2)'}} placeholder="Daraja" />
                        <input value={edu.period} onChange={e => setDraft({...draft, education: draft.education.map((r,i) => i===ei ? {...r, period: e.target.value} : r)})}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm outline-none" style={{color:'var(--text-3)'}} placeholder="2020–hozir" />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium" style={{color:'var(--text-1)'}}>{edu.institution}</h3>
                        <p className="mt-1 text-sm" style={{color:'var(--text-3)'}}>{resolveText(edu.degree,'en')}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{color:'var(--text-4)'}}>{edu.period}</p>
                      </>
                    )}
                  </div>
                ))}
              </Section>

              {/* Skills */}
              <Section title="Ko'nikmalar">
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(draft.skills).map(([key, values]) => (
                    <div key={key} className="rounded-[16px] border border-white/10 p-4" style={{background:'var(--input-bg2)'}}>
                      <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em]" style={{color:'var(--text-4)'}}>{key}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {values.map((v,vi) => editing ? (
                          <input key={vi} value={v} onChange={e => setDraft({...draft, skills:{...draft.skills,[key]:draft.skills[key].map((s,si) => si===vi ? e.target.value : s)}})}
                            className="rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-xs outline-none" style={{color:'var(--text-2)'}} />
                        ) : (
                          <span key={v} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs" style={{color:'var(--text-3)'}}>{v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
