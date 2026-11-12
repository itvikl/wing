'use client';

import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { FaqText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function FaqPreview({ data }: { data: Record<ContentLocale, FaqText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="max-h-[75vh] overflow-y-auto bg-primary-dark p-6 text-neutral-100">
        <div className="text-center">
          <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-light">{value.eyebrow || '—'}</Jump>
          <Jump to="title" as="h2" className="mt-2 font-display text-lg font-semibold">{value.title || '—'}</Jump>
          <Jump to="intro" as="p" className="mt-2 text-xs text-neutral-200">{value.intro || '—'}</Jump>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[11px]">
          <Jump to="allLabel" as="span" className="rounded-full bg-accent px-2.5 py-1 text-primary-dark">{value.allLabel || '—'}</Jump>
          {value.categories.map((c, ci) => (
            <Jump key={ci} to={`categories.${ci}.name`} as="span" className="rounded-full border border-white/25 px-2.5 py-1">{c.name || '—'}</Jump>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-white/15 px-4 pb-2">
          {value.categories.map((c, ci) => (
            <div key={ci} className="pt-3">
              <Jump to={`categories.${ci}.name`} as="h3" className="text-sm font-semibold text-accent-light">{c.name || '—'}</Jump>
              {c.items.map((it, qi) => (
                <div key={qi} className="border-b border-white/10 py-2">
                  <Jump to={`categories.${ci}.items.${qi}.q`} as="p" className="text-xs font-medium">{it.q || '—'}</Jump>
                  {ci === 0 && qi === 0 && (
                    <Jump to={`categories.${ci}.items.${qi}.a`} as="p" className="mt-1 line-clamp-3 text-[11px] text-neutral-200">{it.a || '—'}</Jump>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-accent/45 p-4 text-xs">
          <Jump to="asideEyebrow" as="span" className="uppercase tracking-[0.18em] text-accent-light">{value.asideEyebrow || '—'}</Jump>
          <Jump to="asideTitle" as="p" className="mt-1 font-display text-base font-semibold">{value.asideTitle || '—'}</Jump>
          <Jump to="asideBody" as="p" className="mt-1 text-neutral-200">{value.asideBody || '—'}</Jump>
          <Jump to="asideWhatsapp" as="span" className="mt-2 block rounded-full bg-[#25D366] px-3 py-1.5 text-center font-semibold text-primary-dark">{value.asideWhatsapp || '—'}</Jump>
          <Jump to="asideCall" as="span" className="mt-1.5 block rounded-full border border-accent px-3 py-1.5 text-center text-accent-light">{value.asideCall || '—'}</Jump>
        </div>
      </div>
    </div>
  );
}
