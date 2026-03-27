import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {Inter} from 'next/font/google';
import Script from 'next/script';
import {DEFAULT_META_DESCRIPTION, SITE_NAME, SITE_OWNER, SITE_URL} from '@/lib/site-config';
import './globals.css';

const inter = Inter({subsets: ['latin'], variable: '--font-inter'});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: 'UZAFO | Afzalbek Oribjonov',
  description: DEFAULT_META_DESCRIPTION,
  authors: [{name: SITE_OWNER, url: SITE_URL}],
  creator: SITE_OWNER,
  publisher: SITE_NAME,
  keywords: ['Afzalbek Oribjonov', 'UZAFO', 'portfolio', 'blog', 'AI developer', 'frontend developer'],
  icons: {
    icon: [
      {url: '/favicon.ico', sizes: 'any'},
      {url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48'}
    ],
    shortcut: '/favicon.ico',
    apple: [{url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180'}]
  },
  openGraph: {
    title: 'UZAFO | Afzalbek Oribjonov',
    description: DEFAULT_META_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'UZAFO | Afzalbek Oribjonov',
    description: DEFAULT_META_DESCRIPTION
  }
};

// Anti-FOUC: runs before React, sets data-theme from localStorage
const themeScript = `!function(){try{var t=localStorage.getItem('uzafo-theme')||'dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}}();`;

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="uz" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeScript}</Script>
      </head>
      <body
        className="min-h-screen font-sans antialiased"
        style={{backgroundColor: 'var(--page-bg)', color: 'var(--text-1)'}}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
