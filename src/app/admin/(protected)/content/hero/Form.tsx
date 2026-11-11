'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, sizeField } from '@/components/admin/fields';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveHero, type HeroText } from './actions';
import { HeroPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, HeroText>;

export function HeroForm({ initial, firstCueOwn }: { initial: Data; firstCueOwn: boolean }) {
  async function save(data: Data) {
    await saveHero('he', data.he);
    await saveHero('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<HeroText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    // Only what the opening screen shows. subheadline and cta stay in the
    // saved data untouched: neither renders anywhere (subheadline only fed the
    // flight's first caption, which is edited on the See Wings page now).
    return (
      <div className="grid gap-4">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} jump="eyebrow" {...sizeField(value.sizes, 'eyebrow', (sizes) => update({ sizes }))} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת ראשית" value={value.headline} jump="headline" {...sizeField(value.sizes, 'headline', (sizes) => update({ sizes }))} onChange={(v) => update({ headline: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<HeroPreview data={data} firstCueOwn={firstCueOwn} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
