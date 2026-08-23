'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { VideoText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function VideoPreview({ data }: { data: { text: Record<ContentLocale, VideoText>; poster: string } }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data.text[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-bg p-8 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{value.eyebrow || '—'}</span>
        <h2 className="mt-3 font-display text-xl font-semibold text-primary-dark">{value.title || '—'}</h2>
        <div className="relative mx-auto mt-6 aspect-video max-w-xs overflow-hidden rounded-2xl bg-primary-dark">
          {data.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/70 via-primary-dark/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary-dark">
              ▶
            </span>
            <p className="text-xs font-medium text-neutral-100">{value.cta || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
