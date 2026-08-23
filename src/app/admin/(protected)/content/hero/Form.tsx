'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { ParagraphListField } from '@/components/admin/ParagraphListField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveHero, type HeroText } from './actions';
import { HeroPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, HeroText>;

export function HeroForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveHero('he', data.he);
    await saveHero('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<HeroText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-4">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת ראשית" value={value.headline} onChange={(v) => update({ headline: v })} />
        <ParagraphListField
          label="תת-כותרת"
          values={value.subheadline}
          onChange={(subheadline) => update({ subheadline })}
        />
        <TextField label="טקסט כפתור" value={value.cta} onChange={(v) => update({ cta: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<HeroPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
