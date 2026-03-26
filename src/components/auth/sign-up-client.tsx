'use client';

import {ArrowRight, Chrome, Lock, Mail, UserRound} from 'lucide-react';
import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/navigation';
import {signUp} from '@/lib/auth';
import {Container} from '@/components/ui/container';
import type {Locale} from '@/lib/types';

export function SignUpClient() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const featureItems = locale === 'uz'
    ? ['Xavfsiz kirish', 'Muhokama profili', 'Kontentni yangilash oqimi']
    : ['Secure sign-in', 'Discussion identity', 'Content update flow'];

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Barcha maydonlarni to\'ldiring.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signUp(name, email, password);
      router.push(result.session.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24">
      <Container className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Name</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 focus-within:border-cyan-300/40">
                <UserRound className="h-4 w-4 text-cyan-300" />
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Your name" />
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">{t('email')}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 focus-within:border-cyan-300/40">
                <Mail className="h-4 w-4 text-cyan-300" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="you@example.com" />
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">{t('password')}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 focus-within:border-cyan-300/40">
                <Lock className="h-4 w-4 text-cyan-300" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="••••••••" />
              </div>
            </label>
            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}
            <button type="button" disabled={loading} onClick={submit} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creating account...' : t('signupAction')}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Chrome className="h-4 w-4" />
              {t('continueGoogle')}
            </button>
            <span className="text-xs text-slate-500">{common('notImplemented')}</span>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_24%),rgba(255,255,255,0.05)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">AUTH</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">{t('signupAction')}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{t('subtitle')}</p>
          <div className="mt-8 grid gap-4">
            {featureItems.map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-400">
            {t('alreadyHave')} <Link className="font-medium text-cyan-300 hover:text-cyan-200" href="/auth/sign-in">{t('signinAction')}</Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
