'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { WhyUsText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function WhyUsPreview({ data }: { data: Record<ContentLocale, WhyUsText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-100 p-6 text-center">
        <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-dark"><Sized scale={value.sizes?.eyebrow}>{value.eyebrow || '—'}</Sized></Jump>
        <Jump to="title" as="h2" className="mt-2 font-display text-lg font-semibold text-primary-dark"><Sized scale={value.sizes?.title}>{value.title || '—'}</Sized></Jump>
        <div className="mt-4 grid gap-2 text-start">
          {value.items.length ? (
            value.items.map((item, index) => (
              <div key={index} className="rounded-xl bg-neutral-bg p-3 shadow-sm">
                <Jump to={`items.${index}.title`} as="h3" className="font-display text-sm font-semibold text-primary-dark"><Sized scale={item.sizes?.title}>{item.title || '—'}</Sized></Jump>
                <Jump to={`items.${index}.body`} as="p" className="mt-1 text-xs text-neutral-muted"><Sized scale={item.sizes?.body}>{item.body || '—'}</Sized></Jump>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-muted">אין פריטים עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}
