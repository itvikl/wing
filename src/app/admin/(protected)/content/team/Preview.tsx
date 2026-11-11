'use client';

import Image from 'next/image';
import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { ContentLocale } from '@/lib/content/schema';

type Member = { name: string; initials: string; role: string; bio: string; sizes?: Record<string, number> };
type Labels = { eyebrow: string; title: string; sizes?: Record<string, number> };
type Row = { he: Member; en: Member; image: string | null };

export function TeamPreview({
  labels,
  rows,
}: {
  labels: Record<ContentLocale, Labels>;
  rows: Row[];
}) {
  const [locale, setLocale] = usePreviewLocale();
  const value = labels[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-neutral-100 p-6 text-center">
        <Jump to="eyebrow" as="span" className="text-xs uppercase tracking-[0.2em] text-accent-dark"><Sized scale={value.sizes?.eyebrow}>{value.eyebrow || '—'}</Sized></Jump>
        <Jump to="title" as="h2" className="mt-2 font-display text-lg font-semibold text-primary-dark"><Sized scale={value.sizes?.title}>{value.title || '—'}</Sized></Jump>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {rows.length ? (
            rows.map((row, index) => {
              const member = row[locale];
              return (
                <div key={index} className="flex flex-col items-center rounded-xl bg-neutral-bg p-3 shadow-sm">
                  {row.image ? (
                    <Jump to={`rows.${index}.image`} className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                      <Image src={row.image} alt="" fill unoptimized className="object-cover" />
                    </Jump>
                  ) : (
                    <Jump to={`rows.${index}.initials`} as="span" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark font-display text-xs font-semibold text-accent-light">
                      {member.initials || '—'}
                    </Jump>
                  )}
                  <Jump to={`rows.${index}.name`} as="h3" className="mt-2 text-xs font-semibold text-primary-dark"><Sized scale={member.sizes?.name}>{member.name || '—'}</Sized></Jump>
                  <Jump to={`rows.${index}.role`} as="p" className="text-[10px] uppercase tracking-wide text-accent-dark"><Sized scale={member.sizes?.role}>{member.role || '—'}</Sized></Jump>
                </div>
              );
            })
          ) : (
            <p className="col-span-2 text-xs text-neutral-muted">אין אנשי צוות עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
}
