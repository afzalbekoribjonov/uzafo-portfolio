'use client';

import {useCallback, useMemo, useRef, useState} from 'react';
import type {BlogPost, Discussion, Profile, Project, ResumeData} from '@/lib/types';
import {normalizeBlogPosts, normalizeDiscussions, normalizeProfile, normalizeProjects, normalizeResume} from '@/lib/normalizers';
import {syncDiscussions, syncPosts, syncProfile, syncProjects, syncResume} from '@/lib/api-service';

type KeyName = 'profile' | 'projects' | 'blogPosts' | 'resume' | 'discussions';

async function persistValue<T>(key: KeyName, value: T) {
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
  await syncDiscussions(value as Discussion[]);
}

export function useDemoValue<T>(key: KeyName, initial: T, normalize?: (value: T) => T) {
  const normalizeRef = useRef(normalize);
  const initialValue = normalize ? normalize(initial) : initial;
  const [value, setValue] = useState<T>(initialValue);
  const valueRef = useRef(value);

  const applyNormalized = useCallback((next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
    return normalizeRef.current ? normalizeRef.current(resolved) : resolved;
  }, []);

  const updateValue = useCallback((next: T | ((prev: T) => T)) => {
    const previous = valueRef.current;
    const normalized = applyNormalized(next);
    valueRef.current = normalized;
    setValue(normalized);

    void persistValue(key, normalized).catch((error) => {
      console.error(`Failed to sync ${key}.`, error);
      valueRef.current = previous;
      setValue(previous);
    });
  }, [applyNormalized, key]);

  const replaceValue = useCallback((next: T | ((prev: T) => T)) => {
    const normalized = applyNormalized(next);
    valueRef.current = normalized;
    setValue(normalized);
  }, [applyNormalized]);

  return useMemo(() => [value, updateValue, true, replaceValue] as const, [replaceValue, updateValue, value]);
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
