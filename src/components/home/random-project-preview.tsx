'use client';

import {ArrowRight, Sparkles} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {ButtonLink} from '@/components/ui/button-link';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import {Link} from '@/i18n/navigation';
import {resolveLocaleText} from '@/lib/utils';
import type {Locale, Project} from '@/lib/types';

interface RandomProjectPreviewProps {
  project: Project;
}

export function RandomProjectPreview({project}: RandomProjectPreviewProps) {
  const common = useTranslations('common');
  const home = useTranslations('home');
  const locale = useLocale() as Locale;
  const projectSummary = resolveLocaleText(project.excerpt, locale) || resolveLocaleText(project.description, locale);
  const highlightMetrics = project.metrics.slice(0, 2);

  return (
    <section
      className="overflow-hidden rounded-[36px] border"
      style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}
    >
      <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="order-2 p-6 sm:p-8 lg:order-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--accent)'}}>
              <Sparkles className="h-4 w-4" />
              {home('spotlightTitle')}
            </div>
            <ButtonLink href="/portfolio" variant="ghost">
              {common('viewAll')}
            </ButtonLink>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm" style={{color: 'var(--text-3)'}}>
            <span>{project.year}</span>
            <span>·</span>
            <span>{resolveLocaleText(project.status, locale)}</span>
          </div>

          <h3 className="mt-4 text-2xl font-semibold sm:text-[2rem]" style={{color: 'var(--text-1)'}}>
            {resolveLocaleText(project.title, locale)}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{color: 'var(--text-3)'}}>
            {projectSummary}
          </p>
          <p className="mt-3 text-sm leading-7" style={{color: 'var(--text-4)'}}>
            {home('spotlightSubtitle')}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.slice(0, 8).map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1.5 text-xs"
                style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--text-2)'}}
              >
                {tag}
              </span>
            ))}
          </div>

          {highlightMetrics.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlightMetrics.map((metric) => (
                <div
                  key={`${resolveLocaleText(metric.label, locale)}-${metric.value}`}
                  className="rounded-[22px] border p-4"
                  style={{borderColor: 'var(--border-1)', background: 'var(--elevated)'}}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--text-4)'}}>
                    {resolveLocaleText(metric.label, locale)}
                  </p>
                  <p className="mt-2 text-lg font-semibold" style={{color: 'var(--text-1)'}}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/portfolio/${project.slug}`}
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
            >
              {common('openProject')}
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{borderColor: 'var(--border-1)', background: 'var(--elevated)', color: 'var(--text-2)'}}
            >
              {common('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="order-1 border-b p-4 sm:p-5 lg:order-2 lg:border-l lg:border-b-0" style={{borderColor: 'var(--border-1)'}}>
          <div className="h-full overflow-hidden rounded-[28px]" style={{background: 'var(--elevated)'}}>
            <DynamicMedia
              src={project.cover}
              alt={resolveLocaleText(project.title, locale)}
              className="min-h-[280px] h-full sm:min-h-[340px]"
              mediaClassName="h-full w-full object-cover"
              placeholderTitle={home('placeholders.projectTitle')}
              placeholderHint={home('placeholders.projectHint')}
              controls={false}
              autoPlay
              muted
              loop
            />
          </div>
        </div>
      </div>
    </section>
  );
}
