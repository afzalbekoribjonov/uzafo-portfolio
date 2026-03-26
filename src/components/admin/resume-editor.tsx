'use client';
import {Plus, Trash2} from 'lucide-react';
import {useLocale} from 'next-intl';
import type {Locale, ResumeData} from '@/lib/types';
import {makeId, resolveText} from '@/lib/utils';
import {useState} from 'react';

interface Props { resume: ResumeData; onChange: (r: ResumeData) => void; }
type Tab = 'experience' | 'education' | 'awards';

function Label({children}: {children: React.ReactNode}) {
  return <label className="block mb-1 text-xs font-medium" style={{color:'var(--fg-4)'}}>{children}</label>;
}

export function ResumeEditor({resume, onChange}: Props) {
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<Tab>('experience');

  const tabs: {id: Tab; label: string}[] = [
    {id:'experience', label:'Tajriba'},
    {id:'education', label:'Ta\'lim'},
    {id:'awards', label:'Yutuqlar'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            borderRadius:'999px', padding:'5px 14px', fontSize:'.8rem', cursor:'pointer', fontWeight: tab===t.id ? 600 : 400,
            color: tab===t.id ? 'var(--accent-fg)' : 'var(--fg-3)',
            background: tab===t.id ? 'var(--accent)' : 'var(--bg-surface)',
            border: tab===t.id ? '1px solid var(--accent)' : '1px solid var(--bd)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Experience ── */}
      {tab === 'experience' && (
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {resume.experience.map((exp, i) => (
            <div key={i} className="t-card-inset rounded-[18px] p-4" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <p className="text-sm font-semibold" style={{color:'var(--fg-1)'}}>{exp.company}</p>
                <button type="button" onClick={() => onChange({...resume, experience:resume.experience.filter((_,j)=>j!==i)})}
                  style={{padding:'5px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex'}}>
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <div><Label>Kompaniya</Label>
                  <input value={exp.company} onChange={e => {const next=[...resume.experience];next[i]={...next[i],company:e.target.value};onChange({...resume,experience:next});}}
                    className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div><Label>Lavozim</Label>
                  <input value={resolveText(exp.role,locale)} onChange={e => {const next=[...resume.experience];next[i]={...next[i],role:e.target.value};onChange({...resume,experience:next});}}
                    className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div><Label>Davr</Label>
                  <input value={exp.period} onChange={e => {const next=[...resume.experience];next[i]={...next[i],period:e.target.value};onChange({...resume,experience:next});}}
                    className="t-input rounded-xl px-3 py-2 text-sm" placeholder="2023 – hozir"/>
                </div>
              </div>
              <div>
                <Label>Asosiy yutuqlar (har bir qator alohida)</Label>
                <textarea value={(exp.highlights.en ?? exp.highlights[Object.keys(exp.highlights)[0]] ?? []).join('\n')}
                  onChange={e => {
                    const lines = e.target.value.split('\n');
                    const next = [...resume.experience];
                    next[i] = {...next[i], highlights: {en: lines, uz: lines}};
                    onChange({...resume, experience: next});
                  }}
                  className="t-input w-full rounded-xl px-3 py-2 text-sm resize-none" rows={4}
                  placeholder="- Birinchi yutuq&#10;- Ikkinchi yutuq"/>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...resume, experience:[...resume.experience, {company:'Yangi kompaniya',role:'Lavozim',period:'2024',highlights:{en:['Yutuq'],uz:['Yutuq']}}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Tajriba qo'shish
          </button>
        </div>
      )}

      {/* ── Education ── */}
      {tab === 'education' && (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {resume.education.map((ed, i) => (
            <div key={i} className="t-card-inset rounded-[18px] p-4" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <p className="text-sm font-semibold" style={{color:'var(--fg-1)'}}>{ed.institution}</p>
                <button type="button" onClick={() => onChange({...resume,education:resume.education.filter((_,j)=>j!==i)})}
                  style={{padding:'5px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex'}}>
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px',gap:'8px'}}>
                <div><Label>Muassasa</Label>
                  <input value={ed.institution} onChange={e=>{const n=[...resume.education];n[i]={...n[i],institution:e.target.value};onChange({...resume,education:n});}} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div><Label>Yo'nalish</Label>
                  <input value={resolveText(ed.degree,locale)} onChange={e=>{const n=[...resume.education];n[i]={...n[i],degree:e.target.value};onChange({...resume,education:n});}} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div><Label>Davr</Label>
                  <input value={ed.period} onChange={e=>{const n=[...resume.education];n[i]={...n[i],period:e.target.value};onChange({...resume,education:n});}} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...resume, education:[...resume.education,{institution:'Universitet nomi',degree:'Yo\'nalish',period:'2020–2024'}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Ta'lim qo'shish
          </button>
        </div>
      )}

      {/* ── Awards ── */}
      {tab === 'awards' && (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {resume.awards.map((aw, i) => (
            <div key={i} className="t-card-inset rounded-[18px] p-4" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div><Label>Yutuq nomi</Label>
                    <input value={resolveText(aw.title,locale)} onChange={e=>{const n=[...resume.awards];n[i]={...n[i],title:e.target.value};onChange({...resume,awards:n});}} className="t-input w-full rounded-xl px-3 py-2 text-sm"/>
                  </div>
                  <div><Label>Tavsif</Label>
                    <textarea value={resolveText(aw.description,locale)} onChange={e=>{const n=[...resume.awards];n[i]={...n[i],description:e.target.value};onChange({...resume,awards:n});}} className="t-input w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}/>
                  </div>
                </div>
                <button type="button" onClick={() => onChange({...resume, awards:resume.awards.filter((_,j)=>j!==i)})}
                  style={{marginTop:'18px',padding:'5px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex',flexShrink:0}}>
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...resume, awards:[...resume.awards,{title:'Yangi yutuq',description:'Tavsif…'}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Yutuq qo'shish
          </button>
        </div>
      )}
    </div>
  );
}
