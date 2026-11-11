'use client';

import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { LegalText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

function Doc({ title, titleKey, paragraphs, listKey }: { title: string; titleKey: string; paragraphs: string[]; listKey: string }) {
  return (
    <div className="bg-primary-dark p-6 text-neutral-200">
      <Jump to={titleKey} as="h2" className="font-display text-lg font-semibold text-neutral-100">{title || '—'}</Jump>
      {paragraphs.map((p, i) =>
        p.startsWith('## ') ? (
          <Jump key={i} to={`${listKey}.${i}`} as="h3" className="mt-4 text-sm font-semibold text-accent-light">{p.slice(3)}</Jump>
        ) : (
          <Jump key={i} to={`${listKey}.${i}`} as="p" className="mt-2 line-clamp-3 text-xs">{p || '—'}</Jump>
        ),
      )}
    </div>
  );
}

export function LegalPreview({ data }: { data: Record<ContentLocale, LegalText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="max-h-[70vh] divide-y divide-primary-soft overflow-y-auto">
        <Doc title={value.privacyTitle} titleKey="privacyTitle" paragraphs={value.privacy} listKey="privacy" />
        <Doc title={value.accessibilityTitle} titleKey="accessibilityTitle" paragraphs={value.accessibility} listKey="accessibility" />
      </div>
    </div>
  );
}
