'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import { PreviewNote } from '@/components/admin/SectionLayout';
import type { ContentLocale } from '@/lib/content/schema';

type SceneRow = {
  id: string;
  he: { label: string; eyebrow: string; title: string; body: string };
  en: { label: string; eyebrow: string; title: string; body: string };
  still: string;
};
type CueText = { eyebrow: string; title: string; body?: string; extra?: { label: string; value: string }[] };
type CueRow = { he: CueText; en: CueText };

export function SeeWingsPreview({
  heroCue,
  scenes,
  cues,
  cta,
}: {
  heroCue: Record<ContentLocale, CueText>;
  scenes: SceneRow[];
  cues: CueRow[];
  cta: Record<ContentLocale, { ctaPrimary: string; ctaSecondary: string }>;
}) {
  const [locale, setLocale] = usePreviewLocale();
  const allCues = [heroCue[locale], ...cues.map((c) => c[locale])];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-4">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-200/60">סצנות טיסה</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {scenes.length ? (
            scenes.map((scene) => (
              <div key={scene.id} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-primary-soft">
                {scene.still && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scene.still} alt="" className="h-full w-full object-cover opacity-80" />
                )}
                <span className="absolute bottom-1 start-1 text-[9px] text-neutral-100">
                  {scene[locale].label || scene.id}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-200/60">אין סצנות עדיין</p>
          )}
        </div>

        <p className="mb-2 mt-4 text-[10px] uppercase tracking-wide text-neutral-200/60">כותרות מתחלפות בגלילה</p>
        <div className="grid gap-2">
          {allCues.map((cue, index) => (
            <div key={index} className="rounded-lg bg-black/20 p-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-accent-light">
                {cue.eyebrow || '—'}
              </span>
              <p className="mt-1 font-display text-sm font-bold leading-tight text-neutral-100">{cue.title || '—'}</p>
              {cue.body && <p className="mt-1 text-xs text-neutral-200/80">{cue.body}</p>}
              {!!cue.extra?.length && (
                <p className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-neutral-200/70">
                  {cue.extra.map((f, i) => (
                    <span key={i}>
                      {f.label}: {f.value}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-medium text-primary-dark">
            {cta[locale].ctaPrimary || '—'}
          </span>
          <span className="rounded-full border border-white/30 px-3 py-1 text-[10px] text-neutral-100">
            {cta[locale].ctaSecondary || '—'}
          </span>
        </div>
      </div>
      <PreviewNote>הכותרת הראשונה (הראשונה ברשימה) נגזרת אוטומטית מעמוד ה-Hero ואינה ניתנת לעריכה כאן.</PreviewNote>
    </div>
  );
}
