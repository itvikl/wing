'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import { PreviewNote } from '@/components/admin/SectionLayout';
import type { HeroText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function HeroPreview({ data }: { data: Record<ContentLocale, HeroText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-8 text-start">
        <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-accent-light">
          {value.eyebrow || '—'}
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-neutral-100">{value.headline || '—'}</h2>
        {value.subheadline.join(' ').trim() && (
          <p className="mt-3 text-sm text-neutral-200">{value.subheadline.join(' ').trim()}</p>
        )}
      </div>
      <PreviewNote>
        התגית והכותרת מופיעות במסך הפתיחה, ושוב בכיתוב הראשון של הטיסה. תת-הכותרת מופיעה רק בכיתוב הראשון של הטיסה,
        בתחנה הראשונה אחרי מסך הפתיחה. הכפתור אינו מוצג כרגע באתר.
      </PreviewNote>
    </div>
  );
}
