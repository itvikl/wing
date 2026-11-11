'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { LeadFormText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

const box = 'rounded-lg border border-primary-soft bg-primary px-3 py-2 text-xs text-neutral-200';

export function LeadFormPreview({ data }: { data: Record<ContentLocale, LeadFormText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  const question = (key: 'budget' | 'timeline' | 'purpose' | 'callTime', optionsKey: keyof LeadFormText) =>
    (value[optionsKey] as string[]).some((o) => o.trim()) ? (
      <Jump to={key} className={`${box} flex justify-between gap-2`}>
        <Sized scale={value.sizes?.[key]}>{value[key] || '—'}</Sized>
        <span aria-hidden>▾</span>
      </Jump>
    ) : null;

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-8 text-center text-neutral-100">
        <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-light"><Sized scale={value.sizes?.eyebrow}>{value.eyebrow || '—'}</Sized></Jump>
        <Jump to="title" as="h2" className="mt-3 font-display text-xl font-semibold"><Sized scale={value.sizes?.title}>{value.title || '—'}</Sized></Jump>
        <div className="mt-5 grid gap-2 text-start">
          <Jump to="name" className={box}><Sized scale={value.sizes?.name}>{value.name || '—'}</Sized></Jump>
          <div className="flex gap-2" dir="ltr">
            <Jump to="country" className={`${box} shrink-0`}>US +1 ▾</Jump>
            <Jump to="phone" className={`${box} flex-1`} >
              <span dir={locale === 'he' ? 'rtl' : 'ltr'} className="block text-start"><Sized scale={value.sizes?.phone}>{value.phone || '—'}</Sized></span>
            </Jump>
          </div>
          <Jump to="email" className={box}><Sized scale={value.sizes?.email}>{value.email || '—'}</Sized></Jump>
          <div className="grid grid-cols-2 gap-2">
            {question('budget', 'budgetOptions')}
            {question('timeline', 'timelineOptions')}
            {question('purpose', 'purposeOptions')}
            <div>
              {question('callTime', 'callTimeOptions')}
              <Jump to="timezoneNote" as="p" className="mt-1 text-[10px] text-neutral-200/70">
                {(value.timezoneNote || '—').replace('{tz}', 'New York')}
              </Jump>
            </div>
          </div>
          <Jump to="message" className={box}><Sized scale={value.sizes?.message}>{value.message || '—'}</Sized></Jump>
          <Jump to="consent" className="flex items-start gap-2 text-[11px] text-neutral-200">
            <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm border border-neutral-200" />
            <Sized scale={value.sizes?.consent}>{value.consent || '—'}</Sized>
          </Jump>
        </div>
        <Jump to="submit" as="span" className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-xs font-medium text-primary-dark">
          <Sized scale={value.sizes?.submit}>{value.submit || '—'}</Sized>
        </Jump>
        <p className="mt-2 text-[10px] text-neutral-200/70">
          <Jump to="privacyNote" as="span">{value.privacyNote || '—'}</Jump>{' '}
          <Jump to="privacyLink" as="span" className="underline">{value.privacyLink || '—'}</Jump>
        </p>
        <div className="mt-6 border-t border-dashed border-primary-soft pt-4 text-xs">
          <Jump to="success" as="p" className="text-accent-light"><Sized scale={value.sizes?.success}>{value.success || '—'}</Sized></Jump>
          <Jump to="successWhatsapp" as="span" className="mt-2 inline-block rounded-full bg-[#25D366] px-4 py-1.5 font-semibold text-primary-dark">
            <Sized scale={value.sizes?.successWhatsapp}>{value.successWhatsapp || '—'}</Sized>
          </Jump>
        </div>
      </div>
    </div>
  );
}
