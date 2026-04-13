'use client';

import {ArrowRight, Chrome, Lock, Mail, ShieldCheck} from 'lucide-react';
import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/navigation';
import {signIn} from '@/lib/auth';
import type {Locale} from '@/lib/types';

export function SignInClient() {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError(locale === 'uz' ? 'Email va parol kiriting.' : 'Enter email and password.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    let result;
    try {
      result = await signIn(email, password);
    } catch {
      setLoading(false);
      setError(locale === 'uz' ? 'Email yoki parol noto\'g\'ri.' : 'Invalid email or password.');
      return;
    }
    setLoading(false);
    if (!result.ok) {
      setError(locale === 'uz' ? 'Email yoki parol noto\'g\'ri.' : 'Invalid email or password.');
      return;
    }
    router.push(result.session.role === 'admin' ? '/admin' : '/');
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr] sm:px-6 lg:px-8">
        {/* Left panel */}
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0"
            style={{background:'radial-gradient(circle at 80% 20%, rgba(34,211,238,0.10),transparent 50%),radial-gradient(circle at 20% 80%,rgba(168,85,247,0.09),transparent 50%)'}} />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{color:'var(--accent)'}}>AUTH</p>
            <h1 className="mt-3 text-4xl font-semibold" style={{color:'var(--text-1)'}}>{t('title')}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7" style={{color:'var(--text-3)'}}>{t('subtitle')}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[['Xavfsiz sessiya', ShieldCheck], ['Google tayyor', Chrome], ['Admin qo\'riqlamasi', Lock]].map(([label, Icon]) => {
                const I = Icon as typeof ShieldCheck;
                return (
                  <div key={label as string} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <I className="mb-2 h-5 w-5" style={{color:'var(--accent)'}} />
                    <p className="text-sm" style={{color:'var(--text-2)'}}>{label as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{color:'var(--text-1)'}}>{t('email')}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition focus-within:border-cyan-300/40"
                style={{background:'var(--input-bg)'}}>
                <Mail className="h-4 w-4 shrink-0" style={{color:'var(--accent)'}} />
                <input value={email} onChange={e => {setEmail(e.target.value); setError('');}}
                  onKeyDown={handleKey} type="email" autoComplete="email"
                  className="w-full bg-transparent text-sm outline-none" style={{color:'var(--text-1)'}}
                  placeholder="siz@misol.com" />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{color:'var(--text-1)'}}>{t('password')}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition focus-within:border-cyan-300/40"
                style={{background:'var(--input-bg)'}}>
                <Lock className="h-4 w-4 shrink-0" style={{color:'var(--accent)'}} />
                <input value={password} onChange={e => {setPassword(e.target.value); setError('');}}
                  onKeyDown={handleKey} type="password" autoComplete="current-password"
                  className="w-full bg-transparent text-sm outline-none" style={{color:'var(--text-1)'}}
                  placeholder="••••••••" />
              </div>
            </label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm" style={{color:'var(--text-3)'}}>{t('forgot')}</span>
              <span className="text-xs" style={{color:'var(--text-4)'}}>
                {locale === 'uz' ? 'Xavfsiz kirish' : 'Secure sign-in'}
              </span>
            </div>
            {error && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm" style={{color:'var(--danger)'}}>
                {error}
              </div>
            )}
            <button type="button" onClick={submit} disabled={loading}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
              {loading ? 'Kirish...' : t('signinAction')} {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <button type="button"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
              style={{color:'var(--text-2)'}}>
              <Chrome className="h-4 w-4" /> {t('continueGoogle')}
            </button>
            <p className="pt-1 text-center text-sm" style={{color:'var(--text-3)'}}>
              {t('newHere')} {' '}
              <Link
                href="/auth/sign-up"
                className="font-medium transition hover:opacity-80"
                style={{color:'var(--accent)'}}
              >
                {t('signupAction')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
