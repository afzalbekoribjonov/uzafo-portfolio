'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {BlogPost, Discussion, Profile, Project, ResumeData} from '@/lib/types';
import {normalizeBlogPosts, normalizeDiscussions, normalizeProfile, normalizeProjects, normalizeResume} from '@/lib/normalizers';
import {idbDelete, idbGet, idbSet} from '@/lib/browser-db';
import {isLiveModeEnabled} from '@/lib/auth';
import {fetchDiscussions, fetchPosts, fetchProfile, fetchProjects, fetchResume, syncDiscussions, syncPosts, syncProfile, syncProjects, syncResume} from '@/lib/api-service';

const KEYS = {
  profile: 'uzafo-demo-v7-profile',
  projects: 'uzafo-demo-v7-projects',
  blogPosts: 'uzafo-demo-v7-blog-posts',
  resume: 'uzafo-demo-v7-resume',
  discussions: 'uzafo-demo-v7-discussions'
} as const;

const LEGACY_KEYS = {
  profile: 'uzafo-demo-v5-profile',
  projects: 'uzafo-demo-v5-projects',
  blogPosts: 'uzafo-demo-v5-blog-posts',
  resume: 'uzafo-demo-v5-resume',
  discussions: 'uzafo-demo-v5-discussions'
} as const;

const SYNC_KEY = 'uzafo-demo-v7-sync';
const IS_LIVE = isLiveModeEnabled();

type KeyName = keyof typeof KEYS;

async function loadLiveValue<T>(key: KeyName, fallback: T): Promise<T> {
  try {
    if (key === 'profile') return normalizeProfile(await fetchProfile() as Profile) as T;
    if (key === 'projects') return normalizeProjects((await fetchProjects()).items as Project[]) as T;
    if (key === 'blogPosts') return normalizeBlogPosts((await fetchPosts()).items as BlogPost[]) as T;
    if (key === 'resume') return normalizeResume(await fetchResume() as ResumeData) as T;
    if (key === 'discussions') return normalizeDiscussions((await fetchDiscussions()).items as Discussion[]) as T;
  } catch (error) {
    console.error(`Failed to load live ${key}.`, error);
  }
  return fallback;
}

async function persistLiveValue<T>(key: KeyName, value: T) {
  try {
    if (key === 'profile') {
      await syncProfile(value as Profile);
      return;
    }
    if (key === 'projects') {
      await syncProjects(value as Project[]);
      return;
    }
    if (key === 'blogPosts') {
      await syncPosts(value as BlogPost[]);
      return;
    }
    if (key === 'resume') {
      await syncResume(value as ResumeData);
      return;
    }
    if (key === 'discussions') {
      await syncDiscussions(value as Discussion[]);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('401') && !message.includes('403')) {
      console.error(`Failed to persist live ${key}.`, error);
    }
  }
}

async function readValue<T>(key: string, fallback: T, normalize: ((value: T) => T) | undefined, legacyKey?: string): Promise<T> {
  const finalize = (value: T) => normalize ? normalize(value) : value;

  if (typeof window === 'undefined') return finalize(fallback);

  if (IS_LIVE) return finalize(await loadLiveValue(key as KeyName, fallback));

  try {
    const stored = await idbGet<T>(key);
    if (stored !== undefined) return finalize(stored);
  } catch {}

  if (legacyKey) {
    try {
      const legacyRaw = window.localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw) as T;
        try {
          await idbSet(key, parsed);
          window.localStorage.removeItem(legacyKey);
        } catch {}
        return finalize(parsed);
      }
    } catch {}
  }

  return finalize(fallback);
}

export async function writeDemoValue<T>(key: KeyName, value: T) {
  if (typeof window === 'undefined') return;

  if (IS_LIVE) {
    await persistLiveValue(key, value);
    window.dispatchEvent(new CustomEvent('demo-data-updated', {detail: key}));
    return;
  }

  try {
    await idbSet(KEYS[key], value);
  } catch (error) {
    console.error('Failed to persist demo data.', error);
    return;
  }

  try {
    window.localStorage.setItem(SYNC_KEY, JSON.stringify({key, at: Date.now()}));
  } catch {}

  window.dispatchEvent(new CustomEvent('demo-data-updated', {detail: key}));
}

export async function removeDemoValue(key: KeyName) {
  if (typeof window === 'undefined') return;

  if (!IS_LIVE) {
    try {
      await idbDelete(KEYS[key]);
    } catch (error) {
      console.error('Failed to remove demo data.', error);
    }

    try {
      window.localStorage.removeItem(LEGACY_KEYS[key]);
      window.localStorage.setItem(SYNC_KEY, JSON.stringify({key, at: Date.now()}));
    } catch {}
  }

  window.dispatchEvent(new CustomEvent('demo-data-updated', {detail: key}));
}

export function useDemoValue<T>(key: KeyName, initial: T, normalize?: (value: T) => T) {
  const normalizeRef = useRef(normalize);
  const initialRef = useRef<T>(normalize ? normalize(initial) : initial);
  const [value, setValue] = useState<T>(initialRef.current);
  const valueRef = useRef(value);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    normalizeRef.current = normalize;
  }, [normalize]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const next = await readValue(KEYS[key], initialRef.current, normalizeRef.current, LEGACY_KEYS[key]);
      if (!active) return;
      valueRef.current = next;
      setValue(next);
    };

    void load().finally(() => { if (active) setHydrated(true); });

    const listener = () => { void load(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SYNC_KEY) listener();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('demo-data-updated', listener as EventListener);
    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('demo-data-updated', listener as EventListener);
    };
  }, [key]);

  const updateValue = useCallback((next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
    const normalized = normalizeRef.current ? normalizeRef.current(resolved) : resolved;
    valueRef.current = normalized;
    setValue(normalized);
    void writeDemoValue(key, normalized);
  }, [key]);

  const replaceValue = useCallback((next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
    const normalized = normalizeRef.current ? normalizeRef.current(resolved) : resolved;
    valueRef.current = normalized;
    setValue(normalized);
  }, []);

  return useMemo(() => [value, updateValue, hydrated, replaceValue] as const, [hydrated, replaceValue, updateValue, value]);
}

export function useManagedProfile(initial: Profile) {
  return useDemoValue('profile', initial, normalizeProfile);
}

export function useManagedProjects(initial: Project[]) {
  return useDemoValue('projects', initial, normalizeProjects);
}

export function useManagedBlogPosts(initial: BlogPost[]) {
  return useDemoValue('blogPosts', initial, normalizeBlogPosts);
}

export function useManagedResume(initial: ResumeData) {
  return useDemoValue('resume', initial, normalizeResume);
}

export function useManagedDiscussions(initial: Discussion[]) {
  return useDemoValue('discussions', initial, normalizeDiscussions);
}
