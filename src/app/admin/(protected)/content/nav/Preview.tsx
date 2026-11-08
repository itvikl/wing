'use client';

import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { NavText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function NavPreview({ data }: { data: Record<ContentLocale, NavText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];
  const links = (['about', 'advantages', 'projects', 'team', 'contact'] as const).map((key) => ({ key, label: value[key] }));

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary p-4 text-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs">
            {links.map(({ key, label }) => (
              <Jump key={key} to={key} as="span" className="text-neutral-100/90">
                {label || '—'}
              </Jump>
            ))}
          </div>
          <Jump to="cta" as="span" className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary-dark">
            {value.cta || '—'}
          </Jump>
        </div>
      </div>
    </div>
  );
}
