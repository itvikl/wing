'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { TeamText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function TeamPreview({ data }: { data: Record<ContentLocale, TeamText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-100 p-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{value.eyebrow || '—'}</span>
        <h2 className="mt-2 font-display text-lg font-semibold text-primary-dark">{value.title || '—'}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {value.members.length ? (
            value.members.map((member, index) => (
              <div key={index} className="flex flex-col items-center rounded-xl bg-neutral-bg p-3 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark font-display text-xs font-semibold text-accent-light">
                  {member.initials || '—'}
                </span>
                <h3 className="mt-2 text-xs font-semibold text-primary-dark">{member.name || '—'}</h3>
                <p className="text-[10px] uppercase tracking-wide text-accent-dark">{member.role || '—'}</p>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-xs text-neutral-muted">אין אנשי צוות עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}
