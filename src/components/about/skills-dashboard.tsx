'use client';

import {useLocale} from 'next-intl';
import type {Locale, Profile} from '@/lib/types';
import {resolveLocaleText} from '@/lib/utils';

interface Props { profile: Profile; }

const categoryColors: Record<string, string> = {
  frontend: 'bg-cyan-400',
  backend:  'bg-violet-400',
  ai:       'bg-emerald-400',
  tools:    'bg-amber-400',
};

const pieSegments = [
  {label: 'Frontend', pct: 35, color: '#22d3ee'},
  {label: 'Backend',  pct: 28, color: '#a78bfa'},
  {label: 'AI / ML',  pct: 22, color: '#34d399'},
  {label: 'Tools',    pct: 15, color: '#fbbf24'},
];

function PieChart() {
  let cumulative = 0;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {pieSegments.map((seg, i) => {
          const offset = circumference - (seg.pct / 100) * circumference;
          const rotation = (cumulative / 100) * 360 - 90;
          cumulative += seg.pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${cx} ${cy})`}
              style={{transition: 'stroke-dasharray 1s ease'}}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r - 8} fill="currentColor" className="text-slate-950" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white font-semibold" fontSize="14">100%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" fontSize="10">Stack</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {pieSegments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{background: seg.color}} />
            <span className="text-xs text-slate-400">{seg.label}</span>
            <span className="ml-auto text-xs font-semibold text-white">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsDashboard({profile}: Props) {
  const locale = useLocale() as Locale;

  return (
    <div className="space-y-6">
      {/* Skill progress bars */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Ko'nikmalar darajasi</p>
        <div className="space-y-4">
          {profile.skillMetrics.map((skill, i) => {
            const color = ['bg-cyan-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400', 'bg-blue-400'][i % 6];
            return (
              <div key={skill.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{skill.name}</span>
                  <span className="text-xs font-semibold text-slate-400">{skill.level}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-1000`}
                    style={{width: `${skill.level}%`}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie chart */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Stack taqsimoti</p>
        <PieChart />
      </div>
    </div>
  );
}
