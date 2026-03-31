import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const PUBLIC_FILE = /\.[^/]+$/;

function getCanonicalSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://uzafo.site';

  try {
    return new URL(candidate);
  } catch {
    return new URL('https://uzafo.site');
  }
}

const canonicalSiteUrl = getCanonicalSiteUrl();
const canonicalHost = canonicalSiteUrl.host.replace(/^www\./, '');
const canonicalProtocol = canonicalSiteUrl.protocol;
const wwwAliasHost = `www.${canonicalHost}`;

export default function middleware(request: NextRequest) {
  const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;

  if (requestHost === wwwAliasHost) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = canonicalProtocol;
    redirectUrl.host = canonicalHost;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel).*)'
};
