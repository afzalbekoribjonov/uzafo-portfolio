import {buildPageMetadata} from '@/lib/metadata';
import {SignUpClient} from '@/components/auth/sign-up-client';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return buildPageMetadata('signUp', locale);
}

export default async function SignUpPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SignUpClient />;
}
