'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import { PreviewNote } from '@/components/admin/SectionLayout';
import type { ContentLocale } from '@/lib/content/schema';

type SceneRow = {
  id: string;
  he: { label: string; eyebrow: string; title: string; body: string };
  en: { label: string; eyebrow: string; title: string; body: string };
  still: string;
};
type CueText = {
  eyebrow: string;
  title: string;
  body?: string;
  extra?: { label: string; value: string }[];
  sizes?: Record<string, number>;
};
type CueRow = { he: CueText; en: CueText };

export function SeeWingsPreview({
  scenes,
  cues,
  cta,
}: {
  scenes: SceneRow[];
  cues: CueRow[];
  cta: Record<ContentLocale, { ctaPrimary: string; ctaSecondary: string; sizes?: Record<string, number> }>;
}) {
  const [locale, setLocale] = usePreviewLocale();
  const allCues = cues.map((c) => c[locale]);

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-4">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-200/60">סצנות טיסה</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {scenes.length ? (
            scenes.map((scene, index) => (
              <Jump key={scene.id} to={`scenes.${index}.label`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-primary-soft">
                {scene.still && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scene.still} alt="" className="h-full w-full object-cover opacity-80" />
                )}
                <span className="absolute bottom-1 start-1 text-[9px] text-neutral-100">
                  {scene[locale].label || scene.id}
                </span>
              </Jump>
            ))
          ) : (
            <p className="text-xs text-neutral-200/60">אין סצנות עדיין</p>
          )}
        </div>

        <p className="mb-2 mt-4 text-[10px] uppercase tracking-wide text-neutral-200/60">כותרות מתחלפות בגלילה</p>
        <div className="grid gap-2">
          {allCues.map((cue, index) => (
            <Jump key={index} to={`cues.${index}.title`} className="rounded-lg bg-black/20 p-3">
              <Jump to={`cues.${index}.eyebrow`} as="span" className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-accent-light">
                <Sized scale={cue.sizes?.eyebrow}>{cue.eyebrow || '—'}</Sized>
              </Jump>
              <Jump to={`cues.${index}.title`} as="p" className="mt-1 font-display text-sm font-bold leading-tight text-neutral-100"><Sized scale={cue.sizes?.title}>{cue.title || '—'}</Sized></Jump>
              {cue.body && <Jump to={`cues.${index}.body`} as="p" className="mt-1 text-xs text-neutral-200/80"><Sized scale={cue.sizes?.body}>{cue.body}</Sized></Jump>}
              {!!cue.extra?.length && (
                <p className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-neutral-200/70">
                  {cue.extra.map((f, i) => (
                    <Jump key={i} to={`cues.${index}.extra.${i}.value`} as="span">
                      <Sized scale={cue.sizes?.extra}>
                        {f.label}: {f.value}
                      </Sized>
                    </Jump>
                  ))}
                </p>
              )}
            </Jump>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Jump to="ctaPrimary" as="span" className="rounded-full bg-accent px-3 py-1 text-[10px] font-medium text-primary-dark">
            <Sized scale={cta[locale].sizes?.ctaPrimary}>{cta[locale].ctaPrimary || '—'}</Sized>
          </Jump>
          <Jump to="ctaSecondary" as="span" className="rounded-full border border-white/30 px-3 py-1 text-[10px] text-neutral-100">
            {cta[locale].ctaSecondary || '—'}
          </Jump>
        </div>
      </div>
      <PreviewNote>
        הכותרת הראשונה ברשימה היא התחנה הראשונה בגלילה. את מסך הפתיחה עצמו עורכים בחלק 1 שלמעלה. הכפתור הראשי
        מופיע בכותרת האחרונה; הכפתור המשני אינו מוצג כרגע באתר.
      </PreviewNote>
    </div>
  );
}
