'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { ProjectsText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

type Item = ProjectsText['items'][number];
type Labels = Omit<ProjectsText, 'items'>;
type Row = { he: Item; en: Item; image: string | null };

export function ProjectsPreview({ labels, rows }: { labels: Record<ContentLocale, Labels>; rows: Row[] }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = labels[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-bg p-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{value.eyebrow || '—'}</span>
        <h2 className="mt-2 font-display text-lg font-semibold text-primary-dark">{value.title || '—'}</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {rows.length ? (
            rows.map((row, index) => {
              const item = row[locale];
              return (
                <div
                  key={index}
                  className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-soft to-primary-dark text-start"
                >
                  {row.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-2 text-neutral-100">
                    <h3 className="text-[11px] font-semibold leading-tight">{item.title || '—'}</h3>
                    <p className="text-[9px] text-neutral-200">{item.location || '—'}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-neutral-muted">אין הזדמנויות עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}
