'use client';

import {Menu, Shield, X} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';
import {Link, usePathname} from '@/i18n/navigation';
import {useDemoSession} from '@/lib/auth';
import {cn} from '@/lib/utils';
import {Container} from '@/components/ui/container';
import {AccountDrawer, type AccountActivityData} from '@/components/layout/account-drawer';
import {LocaleSwitcher} from '@/components/layout/locale-switcher';
import {ThemeToggle} from '@/components/layout/theme-toggle';

function getAccountLetter(name: string | null | undefined) {
  const trimmed = name?.trim() ?? '';
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
}

export function SiteHeader({accountActivity}: {accountActivity: AccountActivityData}) {
  const t = useTranslations('nav');
  const accountT = useTranslations('account');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const {hydrated, isAdmin, isSignedIn, session, signOut} = useDemoSession();

  const navItems = [
    {href: '/about', label: t('about')},
    {href: '/portfolio', label: t('portfolio')},
    {href: '/blog', label: t('blog')},
    {href: '/discussions', label: t('discussions')},
    {href: '/resume', label: t('resume')},
  ];

  useEffect(() => {
    if (!accountOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountOpen]);

  const closeMenus = () => {
    setOpen(false);
    setAccountOpen(false);
  };

  const openAccount = () => {
    setOpen(false);
    setAccountOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl" style={{borderBottom:'1px solid var(--border-1)', background:'var(--input-bg)'}}>
      <Container className="flex h-16 items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" onClick={closeMenus} className="group inline-flex cursor-pointer items-center gap-3 transition" aria-label={t('brand')}>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-black tracking-[0.16em] transition duration-200 group-hover:-translate-y-0.5"
              style={{
                borderColor: 'rgba(103,232,249,0.25)',
                background: 'linear-gradient(145deg, rgba(34,211,238,0.18), rgba(15,23,42,0.18))',
                color: 'var(--accent)'
              }}
            >
              U
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-black tracking-[0.32em] md:text-base" style={{color:'var(--text-1)'}}>
                {t('brand')}
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.26em] md:block" style={{color:'var(--text-4)'}}>
                Afzalbek Oribjonov
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={closeMenus}
                  className={cn('cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition duration-150',
                    active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/6 hover:text-white'
                  )}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <LocaleSwitcher />
          {hydrated && isAdmin && (
            <Link href="/admin" onClick={closeMenus}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20">
              <Shield className="h-3.5 w-3.5" /> {t('admin')}
            </Link>
          )}
          {hydrated && isSignedIn ? (
            <button
              type="button"
              onClick={openAccount}
              aria-label={accountT('open')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-sm font-black tracking-[0.12em] text-cyan-300 transition hover:-translate-y-0.5 hover:bg-cyan-400/20"
            >
              {getAccountLetter(session?.name)}
            </button>
          ) : (
            <Link href="/auth/sign-in" onClick={closeMenus}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
              {t('signin')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {hydrated && isSignedIn ? (
            <button
              type="button"
              onClick={openAccount}
              aria-label={accountT('open')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-sm font-black tracking-[0.12em] text-cyan-300 transition hover:bg-cyan-400/20"
            >
              {getAccountLetter(session?.name)}
            </button>
          ) : null}
          <button type="button" aria-label="Menyu"
            className="inline-flex cursor-pointer rounded-full border border-white/10 p-2 transition hover:bg-white/10"
            style={{color:'var(--text-3)'}}
            onClick={() => setOpen(p => !p)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t lg:hidden" style={{borderColor:'var(--border-1)', background:'var(--elevated)'}}>
          <Container className="space-y-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><ThemeToggle /><LocaleSwitcher /></div>
            </div>
            <nav className="grid gap-1.5">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={cn('cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium transition',
                    pathname === item.href ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}>
                  {item.label}
                </Link>
              ))}
              {hydrated && isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20">
                  <Shield className="h-4 w-4" /> {t('admin')}
                </Link>
              )}
              {!(hydrated && isSignedIn) ? (
                <Link href="/auth/sign-in" onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
                  {t('signin')}
                </Link>
              ) : null}
            </nav>
          </Container>
        </div>
      )}
      <AccountDrawer
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        session={session}
        activity={accountActivity}
        onSignOut={() => {
          signOut();
          setAccountOpen(false);
        }}
      />
    </header>
  );
}
