'use client';

import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { LeadFormText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function LeadFormPreview({ data }: { data: Record<ContentLocale, LeadFormText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-8 text-center text-neutral-100">
        <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-light">{value.eyebrow || '—'}</Jump>
        <Jump to="title" as="h2" className="mt-3 font-display text-xl font-semibold">{value.title || '—'}</Jump>
        <div className="mt-5 grid gap-2 text-start">
          {(['name', 'phone', 'email', 'message'] as const).map((key) => (
            <Jump key={key} to={key} className="rounded-lg border border-primary-soft bg-primary px-3 py-2 text-xs text-neutral-200">
              {value[key] || '—'}
            </Jump>
          ))}
        </div>
        <Jump to="submit" as="span" className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-xs font-medium text-primary-dark">
          {value.submit || '—'}
        </Jump>
      </div>
    </div>
  );
}
