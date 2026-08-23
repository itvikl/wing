'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveMap, type MapText } from './actions';
import { MapPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, MapText>;

export function MapForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveMap('he', data.he);
    await saveMap('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<MapText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-4">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={
          <div>
            <LocaleTabs he={fields('he')} en={fields('en')} />
            <p className="mt-4 text-xs text-neutral-muted">הסימונים על המפה נגזרים אוטומטית מרשימת ה&quot;הזדמנויות&quot;.</p>
          </div>
        }
        preview={<MapPreview data={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
