'use client';

import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {SectionHeading} from '@/components/ui/section-heading';
import {Link} from '@/i18n/navigation';
import {resolveLocaleText} from '@/lib/utils';
import type {Locale, Project} from '@/lib/types';

interface RandomProjectPreviewProps {
  project: Project;
}

export function RandomProjectPreview({project}: RandomProjectPreviewProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      <SectionHeading title={t('randomProject')} action={<ButtonLink href={`/portfolio/${project.slug}`} variant="ghost">{t('viewAll')}</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <DynamicMedia src={project.cover} alt={resolveLocaleText(project.title, locale)} className="rounded-[28px] border border-white/10 bg-slate-900" placeholderTitle="This work sample has no cover yet" placeholderHint="Open the project to attach an image or video when needed." />
        <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>{project.year}</span>
              <span>·</span>
              <span>{resolveLocaleText(project.status, locale)}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">{resolveLocaleText(project.title, locale)}</h3>
            <p className="text-sm leading-7 text-slate-300">{resolveLocaleText(project.description, locale)}</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/portfolio/${project.slug}`}
              className="inline-flex cursor-pointer items-center rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {t('openProject')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
