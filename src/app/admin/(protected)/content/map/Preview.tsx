'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { MapText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function MapPreview({ data }: { data: Record<ContentLocale, MapText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-100 p-8 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{value.eyebrow || '—'}</span>
        <h2 className="mt-3 font-display text-xl font-semibold text-primary-dark">{value.title || '—'}</h2>
        <div className="mt-6 flex h-32 items-center justify-center rounded-2xl bg-primary-soft text-accent-light">
          מפה אינטראקטיבית
        </div>
      </div>
    </div>
  );
}
