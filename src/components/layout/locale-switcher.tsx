'use client';

import {Check, Languages} from 'lucide-react';
import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

const options = [
  {value: 'uz', label: "Oʻzbek"},
  {value: 'en', label: 'English'}
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs text-white/80 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">
      <div className="flex items-center gap-2 rounded-full px-3 py-2 text-slate-300">
        <Languages className="h-4 w-4 text-cyan-300" />
      </div>
      {options.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => router.replace(pathname, {locale: option.value})}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 font-semibold transition',
              active ? 'bg-cyan-400 text-slate-950' : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
