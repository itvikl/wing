'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import { PreviewNote } from '@/components/admin/SectionLayout';
import type { HeroText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

/** The opening screen: the alley still, the logo, and under it the eyebrow and headline. */
export function HeroPreview({ data, firstCueOwn }: { data: Record<ContentLocale, HeroText>; firstCueOwn: boolean }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="relative overflow-hidden bg-primary-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/scroll-world/img/main.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="relative flex flex-col items-center px-6 py-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="" className="h-14 w-auto" />
          <span className="mt-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            {value.eyebrow || '—'}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-neutral-100">{value.headline || '—'}</h2>
        </div>
      </div>
      <PreviewNote>
        מסך הפתיחה, לפני שמתחילים לגלול.{' '}
        {firstCueOwn
          ? 'הכיתובים שמופיעים בזמן הגלילה נערכים בעמוד הטיסה הקולנועית.'
          : 'הכיתוב הראשון בגלילה עדיין חוזר על התגית והכותרת מכאן. כדי להפריד ביניהם, שמרו פעם אחת את עמוד הטיסה הקולנועית.'}
      </PreviewNote>
    </div>
  );
}
