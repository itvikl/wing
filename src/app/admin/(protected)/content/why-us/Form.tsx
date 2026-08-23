'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveWhyUs, type WhyUsText } from './actions';
import { WhyUsPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Item = WhyUsText['items'][number];
type Data = Record<ContentLocale, WhyUsText>;

export function WhyUsForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveWhyUs('he', data.he);
    await saveWhyUs('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<WhyUsText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));

    return (
      <div className="grid gap-6">
        <div className="grid gap-4">
          <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
        </div>
        <RepeatableList<Item>
          items={value.items}
          onChange={(items) => update({ items })}
          newItem={() => ({ title: '', body: '' })}
          addLabel="הוספת יתרון"
          renderItem={(item, updateItem) => (
            <div className="grid gap-3">
              <TextField label="כותרת" value={item.title} onChange={(v) => updateItem({ title: v })} />
              <TextAreaField label="טקסט" value={item.body} onChange={(v) => updateItem({ body: v })} />
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={<LocaleTabs he={fields('he')} en={fields('en')} />}
        preview={<WhyUsPreview data={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
