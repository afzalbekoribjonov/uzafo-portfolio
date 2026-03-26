import {Github, Linkedin, Phone, Send} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Container} from '@/components/ui/container';
import {getSite} from '@/lib/data';

const iconMap = {GitHub: Github, LinkedIn: Linkedin, Telegram: Send, Phone};

export async function SiteFooter() {
  const [t, site] = await Promise.all([
    getTranslations('footer'),
    getSite(),
  ]);
  return (
    <footer className="py-12" style={{borderTop:'1px solid var(--border-1)', background:'var(--input-bg)'}}>
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-2">
            <p className="text-base font-semibold" style={{color:'var(--text-1)'}}>{t('title')}</p>
            <p className="max-w-md text-sm leading-7" style={{color:'var(--text-3)'}}>{t('subtitle')}</p>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{color:'var(--accent)'}}>{site.brand}</p>
            <div className="flex flex-wrap gap-2">
              {site.socials.map(s => {
                const Icon = iconMap[s.name as keyof typeof iconMap] ?? Send;
                const isExternal = /^https?:\/\//.test(s.href);
                return (
                  <a key={s.name} href={s.href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm transition hover:bg-white/10"
                    style={{color:'var(--text-3)'}}>
                    <Icon className="h-3.5 w-3.5" /> {s.name}
                  </a>
                );
              })}
            </div>
            <p className="text-xs" style={{color:'var(--text-4)'}}>© {new Date().getFullYear()} {site.brand}. {t('copyright')}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
