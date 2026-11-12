'use client';

import Image from 'next/image';
import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { AboutText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function AboutPreview({ data }: { data: Record<ContentLocale, AboutText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const a = data[locale];
  const eyebrow = 'text-[10px] uppercase tracking-[0.2em] text-accent-light';
  const facts = [
    ['foundedLabel', 'founded'],
    ['officeLabel', 'office'],
    ['licenseLabel', 'license'],
  ] as const;

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="max-h-[75vh] overflow-y-auto bg-primary-dark p-6 text-neutral-100">
        <div className="text-center">
          <Jump to="eyebrow" as="span" className={eyebrow}><Sized scale={a.sizes?.eyebrow}>{a.eyebrow || '—'}</Sized></Jump>
          <Jump to="title" as="h2" className="mt-2 font-display text-2xl font-semibold"><Sized scale={a.sizes?.title}>{a.title || '—'}</Sized></Jump>
          <Jump to="body" as="p" className="mt-3 font-display text-base leading-relaxed" >
            <span lang="he" dir="rtl">{a.body.filter(Boolean).join(' / ') || '—'}</span>
          </Jump>
          <Jump to="verseSource" as="p" className="mt-1 text-[10px] text-accent-light">{a.verseSource || '—'}</Jump>
          <Jump to="verseTranslation" as="p" className="mt-1 text-[11px] italic text-neutral-200">{a.verseTranslation || '—'}</Jump>
          <Jump to="nameLine" as="p" className="mt-3 text-xs text-neutral-200">{a.nameLine || '—'}</Jump>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Jump to="storyEyebrow" as="span" className={eyebrow}>{a.storyEyebrow || '—'}</Jump>
          <Jump to="storyTitle" as="h3" className="mt-1 font-display text-lg font-semibold">{a.storyTitle || '—'}</Jump>
          {(a.story.length ? a.story : ['—']).map((p, i) => (
            <Jump key={i} to={a.story.length ? `story.${i}` : 'story'} as="p" className="mt-2 text-xs leading-relaxed text-neutral-200">{p || '—'}</Jump>
          ))}
          <Jump to="storyClosing" as="p" className="mt-2 font-display text-sm">{a.storyClosing || '—'}</Jump>
        </div>

        <div className="mt-5">
          <Jump to="photo" className="relative block aspect-[16/9] overflow-hidden rounded border-2 border-accent bg-primary">
            {a.photo ? (
              <Image src={a.photo} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[11px] text-neutral-200">אין תמונה: האזור לא יוצג</span>
            )}
          </Jump>
          <div className="mt-1.5 flex justify-between text-[11px]">
            <Jump to="photoCaption" as="span" className="text-neutral-200">{a.photoCaption || '—'}</Jump>
            <Jump to="teamLink" as="span" className="text-accent-light">{a.teamLink || '—'}</Jump>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Jump to="missionEyebrow" as="span" className={eyebrow}>{a.missionEyebrow || '—'}</Jump>
          <Jump to="mission" as="p" className="mt-1 font-display text-base">{a.mission || '—'}</Jump>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]">
          {facts.map(([label, value]) => (
            <div key={value} className="border-t border-accent pt-1.5">
              <Jump to={label} as="div" className="text-accent-light">{a[label] || '—'}</Jump>
              <Jump to={value} as="div" className="mt-0.5 text-xs">{a[value] || <span className="text-neutral-200/60">ריק: לא יוצג</span>}</Jump>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <Jump to="closingTitle" as="span" className="font-display text-base">{a.closingTitle || '—'}</Jump>
          <span className="flex gap-3">
            <Jump to="closingWhy" as="span" className="underline">{a.closingWhy || '—'}</Jump>
            <Jump to="closingCall" as="span" className="bg-accent px-2 py-1 text-primary-dark">{a.closingCall || '—'}</Jump>
          </span>
        </div>
      </div>
    </div>
  );
}
