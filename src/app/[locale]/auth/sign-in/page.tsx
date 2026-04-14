import {buildPageMetadata, NON_INDEXABLE_ROBOTS} from '@/lib/metadata';
import {SignInClient} from '@/components/auth/sign-in-client';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/lib/types';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return buildPageMetadata('signIn', locale, {robots: NON_INDEXABLE_ROBOTS});
}

export default async function SignInPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SignInClient />;
}
