'use client';

import {useEffect, useState} from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, '') ?? '';
const POLL_INTERVAL_MS = 5000;

async function probeBackend() {
  if (!API_BASE) return false;

  try {
    const headResponse = await fetch(`${API_BASE}/health`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    if (headResponse.ok) return true;
  } catch {
    // Fall through to GET.
  }

  try {
    const response = await fetch(`${API_BASE}/health`, {
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function BackendConnectingScreen() {
  const [attempts, setAttempts] = useState(0);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const runProbe = async () => {
      const ready = await probeBackend();
      if (!active) return;

      setAttempts((current) => current + 1);
      setLastCheckedAt(new Date());

      if (ready) {
        window.location.reload();
      }
    };

    void runProbe();
    const intervalId = window.setInterval(() => {
      void runProbe();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em]" style={{color: 'var(--accent)'}}>
          Backend
        </p>
        <h1 className="mt-3 text-3xl font-semibold" style={{color: 'var(--text-1)'}}>
          Connecting ...
        </h1>
        <p className="mt-4 text-sm leading-7" style={{color: 'var(--text-3)'}}>
          Frontend backend javobini kutyapti. Server tayyor bo‘lishi bilan sahifa avtomatik ochiladi.
        </p>
        <div className="mt-8 rounded-[24px] border border-white/10 bg-slate-950/40 px-5 py-4 text-sm" style={{color: 'var(--text-3)'}}>
          <p>API: {API_BASE || 'NEXT_PUBLIC_API_BASE topilmadi'}</p>
          <p className="mt-2">Tekshiruvlar: {attempts}</p>
          <p className="mt-2">
            Oxirgi urinish: {lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : 'hali tekshirilmagan'}
          </p>
        </div>
      </div>
    </section>
  );
}
