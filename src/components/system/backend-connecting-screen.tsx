'use client';

import {useEffect, useState} from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, '') ?? '';
const POLL_INTERVAL_MS = 5000;
const DOT_FRAMES = ['', '.', '..', '...'];

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
  const [dotFrame, setDotFrame] = useState(0);

  useEffect(() => {
    let active = true;

    const runProbe = async () => {
      const ready = await probeBackend();
      if (!active) return;

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

  useEffect(() => {
    const frameId = window.setInterval(() => {
      setDotFrame((current) => (current + 1) % DOT_FRAMES.length);
    }, 450);

    return () => {
      window.clearInterval(frameId);
    };
  }, []);

  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-16"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.12) 0%, transparent 32%),' +
          'radial-gradient(circle at 80% 80%, rgba(56,189,248,0.1) 0%, transparent 30%),' +
          'linear-gradient(180deg, #03111f 0%, #071a2d 100%)'
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl">
          Connecting{DOT_FRAMES[dotFrame]}
        </h1>
      </div>
    </section>
  );
}
