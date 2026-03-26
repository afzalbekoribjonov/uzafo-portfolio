'use client';
import {Minus, Plus, Trash2} from 'lucide-react';
import {useState} from 'react';
import {useLocale} from 'next-intl';
import type {Locale, Profile} from '@/lib/types';
import {makeId, resolveText} from '@/lib/utils';

interface Props { profile: Profile; onChange: (p: Profile) => void; }

type Tab = 'skills' | 'stack' | 'timeline' | 'stats';

function Label({children}: {children: React.ReactNode}) {
  return <label className="block mb-1 text-xs font-medium" style={{color:'var(--fg-4)'}}>{children}</label>;
}

function Row({children}: {children: React.ReactNode}) {
  return <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>{children}</div>;
}

export function ProfileEditor({profile, onChange}: Props) {
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<Tab>('skills');

  const tabs: {id: Tab; label: string}[] = [
    {id:'skills', label:'Ko\'nikmalar'},
    {id:'stack', label:'Tech Stack'},
    {id:'timeline', label:'Timeline'},
    {id:'stats', label:'Statistika'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      {/* Tab switcher */}
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

      {/* ── Skills tab ── */}
      {tab === 'skills' && (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <p className="text-xs" style={{color:'var(--fg-4)'}}>Ko'nikmalar darajasini 0–100 oralig'ida belgilang</p>
          {profile.skillMetrics.map((s, i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px auto',gap:'8px',alignItems:'center'}}>
              <input value={s.name} onChange={e => {
                  const next = [...profile.skillMetrics];
                  next[i] = {...next[i], name: e.target.value};
                  onChange({...profile, skillMetrics: next});
                }} className="t-input rounded-xl px-3 py-2 text-sm" placeholder="Ko'nikma nomi"/>
              <input type="number" min="0" max="100" value={s.level} onChange={e => {
                  const next = [...profile.skillMetrics];
                  next[i] = {...next[i], level: Number(e.target.value)};
                  onChange({...profile, skillMetrics: next});
                }} className="t-input rounded-xl px-3 py-2 text-sm"/>
              <div style={{height:'6px',background:'var(--bg-deep)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${s.level}%`,background:'var(--accent)',borderRadius:'3px',transition:'width .3s'}}/>
              </div>
              <button type="button" onClick={() => onChange({...profile, skillMetrics: profile.skillMetrics.filter((_,j)=>j!==i)})}
                style={{padding:'6px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex'}}>
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...profile, skillMetrics: [...profile.skillMetrics, {name:'Yangi ko\'nikma', level:50}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Ko'nikma qo'shish
          </button>
        </div>
      )}

      {/* ── Tech stack tab ── */}
      {tab === 'stack' && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {profile.techCategories.map((cat, ci) => (
            <div key={cat.key} className="t-card-inset rounded-[18px] p-4" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <Label>Kategoriya nomi</Label>
                  <input value={resolveText(cat.title, locale)} onChange={e => {
                    const next = [...profile.techCategories];
                    next[ci] = {...next[ci], title: e.target.value};
                    onChange({...profile, techCategories: next});
                  }} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div>
                  <Label>Kalit so'z</Label>
                  <input value={cat.key} onChange={e => {
                    const next = [...profile.techCategories];
                    next[ci] = {...next[ci], key: e.target.value};
                    onChange({...profile, techCategories: next});
                  }} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
              </div>
              <div>
                <Label>Texnologiyalar (bitta qatorda bitta)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cat.items.map((item, ii) => (
                    <div key={ii} style={{display:'flex',alignItems:'center',gap:'4px',background:'var(--bg-surface)',border:'1px solid var(--bd)',borderRadius:'999px',padding:'3px 10px'}}>
                      <input value={item} onChange={e => {
                        const next = [...profile.techCategories];
                        const items = [...next[ci].items];
                        items[ii] = e.target.value;
                        next[ci] = {...next[ci], items};
                        onChange({...profile, techCategories: next});
                      }} style={{background:'transparent',border:'none',outline:'none',width:`${Math.max(50, item.length*8)}px`,fontSize:'.78rem',color:'var(--fg-1)'}}/>
                      <button type="button" onClick={() => {
                        const next = [...profile.techCategories];
                        next[ci] = {...next[ci], items: next[ci].items.filter((_,j)=>j!==ii)};
                        onChange({...profile, techCategories: next});
                      }} style={{display:'inline-flex',color:'var(--fg-4)',cursor:'pointer',padding:'1px'}}>
                        <Minus className="h-3 w-3"/>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const next = [...profile.techCategories];
                    next[ci] = {...next[ci], items: [...next[ci].items, 'Yangi']};
                    onChange({...profile, techCategories: next});
                  }} style={{borderRadius:'999px',padding:'3px 10px',fontSize:'.78rem',cursor:'pointer',color:'var(--accent)',background:'var(--accent-bg)',border:'1px solid var(--bd-accent)',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                    <Plus className="h-3 w-3"/> Qo'shish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline tab ── */}
      {tab === 'timeline' && (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {profile.timeline.map((item, i) => (
            <div key={i} className="t-card-inset rounded-[18px] p-4" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'90px 1fr auto',gap:'8px',alignItems:'flex-start'}}>
                <div>
                  <Label>Yil</Label>
                  <input value={item.year} onChange={e => {
                    const next = [...profile.timeline]; next[i] = {...next[i], year:e.target.value};
                    onChange({...profile, timeline:next});
                  }} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div>
                  <Label>Sarlavha</Label>
                  <input value={resolveText(item.title,locale)} onChange={e => {
                    const next = [...profile.timeline]; next[i] = {...next[i], title:e.target.value};
                    onChange({...profile, timeline:next});
                  }} className="t-input rounded-xl px-3 py-2 text-sm"/>
                </div>
                <button type="button" onClick={() => onChange({...profile, timeline:profile.timeline.filter((_,j)=>j!==i)})}
                  style={{marginTop:'20px',padding:'6px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex'}}>
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>
              <div>
                <Label>Tavsif</Label>
                <textarea value={resolveText(item.description,locale)} onChange={e => {
                  const next = [...profile.timeline]; next[i] = {...next[i], description:e.target.value};
                  onChange({...profile, timeline:next});
                }} className="t-input w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}/>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...profile, timeline:[...profile.timeline, {year:String(new Date().getFullYear()), title:'Yangi voqea', description:'Tavsif…'}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Voqea qo'shish
          </button>
        </div>
      )}

      {/* ── Stats tab ── */}
      {tab === 'stats' && (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {profile.stats.map((s, i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 120px auto',gap:'8px',alignItems:'center'}}>
              <input value={resolveText(s.label,locale)} onChange={e => {
                const next = [...profile.stats]; next[i] = {...next[i], label:e.target.value};
                onChange({...profile, stats:next});
              }} className="t-input rounded-xl px-3 py-2 text-sm" placeholder="Yorliq"/>
              <input value={s.value} onChange={e => {
                const next = [...profile.stats]; next[i] = {...next[i], value:e.target.value};
                onChange({...profile, stats:next});
              }} className="t-input rounded-xl px-3 py-2 text-sm text-center" placeholder="Qiymat"/>
              <button type="button" onClick={() => onChange({...profile, stats:profile.stats.filter((_,j)=>j!==i)})}
                style={{padding:'6px',borderRadius:'8px',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',color:'var(--danger)',cursor:'pointer',display:'inline-flex'}}>
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({...profile, stats:[...profile.stats, {label:'Yangi', value:'0'}]})}
            className="t-btn-ghost rounded-xl py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4"/> Statistika qo'shish
          </button>
        </div>
      )}
    </div>
  );
}
