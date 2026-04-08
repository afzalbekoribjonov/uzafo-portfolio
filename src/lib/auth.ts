'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import type {DemoSession} from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, '') ?? '';
const IS_LIVE = Boolean(API_BASE);
const SESSION_KEY = 'uzafo-live-session-v1';
const AUTH_EVENT = 'auth-updated';

type StoredSession = {
  accessToken: string;
  accessTokenExpiresAt?: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
  user: DemoSession & {id?: string};
};

type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt?: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
  user: {
    id?: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
};

let refreshPromise: Promise<StoredSession | null> | null = null;

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  emit();
}

function toStoredSession(payload: AuthResponse): StoredSession {
  return {
    accessToken: payload.accessToken,
    accessTokenExpiresAt: payload.accessTokenExpiresAt,
    refreshToken: payload.refreshToken,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
    user: {
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name,
      role: payload.user.role
    }
  };
}

function ensureApiBase() {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_BASE is not configured.');
  }
  return API_BASE;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = ensureApiBase();
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function isLiveModeEnabled() {
  return IS_LIVE;
}

async function refreshLiveSession(): Promise<StoredSession | null> {
  const current = readStoredSession();
  if (!current?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const payload = await fetchJson<AuthResponse>('/api/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({refreshToken: current.refreshToken})
        });
        const next = toStoredSession(payload);
        writeStoredSession(next);
        return next;
      } catch {
        writeStoredSession(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function authFetch(input: string, init?: RequestInit, allowRefresh = true): Promise<Response> {
  const apiBase = ensureApiBase();

  const session = readStoredSession();
  const headers = new Headers(init?.headers ?? {});
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${apiBase}${input}`, {
    ...init,
    headers
  });

  if (response.status !== 401 || !allowRefresh) {
    return response;
  }

  const refreshed = await refreshLiveSession();
  if (!refreshed?.accessToken) return response;

  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`);
  return fetch(`${apiBase}${input}`, {
    ...init,
    headers: retryHeaders
  });
}

export async function signIn(email: string, password: string) {
  const payload = await fetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password})
  });
  const session = toStoredSession(payload);
  writeStoredSession(session);
  return {ok: true as const, session: session.user};
}

export async function signUp(name: string, email: string, password: string) {
  const payload = await fetchJson<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({name, email, password})
  });
  const session = toStoredSession(payload);
  writeStoredSession(session);
  return {ok: true as const, session: session.user};
}

export async function signOutLive() {
  const current = readStoredSession();
  try {
    if (current?.refreshToken) {
      await fetchJson('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({refreshToken: current.refreshToken})
      });
    }
  } catch {
    // ignore logout transport failures, local session is still cleared.
  } finally {
    writeStoredSession(null);
  }
}

export function getAccessToken() {
  return readStoredSession()?.accessToken ?? null;
}

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = () => {
      const current = readStoredSession();
      setSession(current?.user ?? null);
    };

    load();
    setHydrated(true);
    window.addEventListener('storage', load);
    window.addEventListener(AUTH_EVENT, load as EventListener);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener(AUTH_EVENT, load as EventListener);
    };
  }, []);

  const signOut = useCallback(() => {
    void signOutLive();
  }, []);

  return useMemo(() => ({
    hydrated,
    session,
    isSignedIn: !!session,
    isAdmin: session?.role === 'admin',
    signOut
  }), [hydrated, session, signOut]);
}
