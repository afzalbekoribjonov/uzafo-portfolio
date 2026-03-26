'use client';

import {Moon, Sun} from 'lucide-react';
import {useTheme} from '@/lib/theme';

export function ThemeToggle({className = ''}: {className?: string}) {
  const {theme, toggle} = useTheme();
  return (
    <button type="button" onClick={toggle}
      aria-label={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
      title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 ${className}`}
      style={{color: 'var(--text-3)'}}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
