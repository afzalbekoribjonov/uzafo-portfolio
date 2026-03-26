import {getTranslations} from 'next-intl/server';
import {ButtonLink} from '@/components/ui/button-link';
import {Container} from '@/components/ui/container';

export default async function LocalizedNotFound() {
  const t = await getTranslations('errors');

  return (
    <section className="py-28">
      <Container className="max-w-2xl">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">404</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">{t('notFoundTitle')}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">{t('notFoundText')}</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/">{t('goHome')}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
