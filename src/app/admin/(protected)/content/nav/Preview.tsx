'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { NavText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function NavPreview({ data }: { data: Record<ContentLocale, NavText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];
  const links = [value.about, value.advantages, value.projects, value.team, value.contact];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary p-4 text-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs">
            {links.map((label, index) => (
              <span key={index} className="text-neutral-100/90">
                {label || '—'}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary-dark">
            {value.cta || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
