'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
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
          <Jump to="eyebrow" as="span" className="mt-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            <Sized scale={value.sizes?.eyebrow}>{value.eyebrow || '—'}</Sized>
          </Jump>
          <Jump to="headline" as="h2" className="mt-2 font-display text-2xl font-bold leading-tight text-neutral-100"><Sized scale={value.sizes?.headline}>{value.headline || '—'}</Sized></Jump>
        </div>
      </div>
      <PreviewNote>
        מסך הפתיחה, לפני שמתחילים לגלול.{' '}
        {firstCueOwn
          ? 'הכיתובים שמופיעים בזמן הגלילה נערכים למטה, בחלק 2.'
          : 'הכיתוב הראשון בגלילה עדיין חוזר על הכותרות מכאן. כדי להפריד ביניהם, שמרו פעם אחת את חלק 2 (הטיסה).'}
      </PreviewNote>
    </div>
  );
}
