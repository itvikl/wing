'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { AboutText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function AboutPreview({ data }: { data: Record<ContentLocale, AboutText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-bg p-8 text-center">
        <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-dark"><Sized scale={value.sizes?.eyebrow}>{value.eyebrow || '—'}</Sized></Jump>
        <Jump to="title" as="h2" className="mt-3 font-display text-xl font-semibold text-primary-dark"><Sized scale={value.sizes?.title}>{value.title || '—'}</Sized></Jump>
        {(value.body.length ? value.body : ['—']).map((paragraph, index) => (
          <Jump key={index} to={value.body.length ? `body.${index}` : 'body'} as="p" className="mx-auto mt-3 max-w-sm text-sm text-neutral-muted">
            <Sized scale={value.sizes?.body}>{paragraph}</Sized>
          </Jump>
        ))}
      </div>
    </div>
  );
}
