'use client';

import {useEffect, useState} from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'uzafo-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' ? 'light' : 'dark';
  } catch { return 'dark'; }
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  // Use data-theme attribute for reliable CSS targeting
  document.documentElement.setAttribute('data-theme', theme);
  // Also update color-scheme for browser UI elements (scrollbars, etc.)
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(KEY, theme); } catch {}
  window.dispatchEvent(new CustomEvent('theme-changed', {detail: theme}));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Read from DOM (already set by the anti-FOUC script)
    const current = (document.documentElement.getAttribute('data-theme') as Theme) ?? getStoredTheme();
    setTheme(current);

    const handler = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  const toggle = () => applyTheme(theme === 'dark' ? 'light' : 'dark');

  return {theme, toggle, isDark: theme === 'dark', isLight: theme === 'light'};
}
