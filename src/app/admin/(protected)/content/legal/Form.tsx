'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { ParagraphListField } from '@/components/admin/ParagraphListField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveLegal, type LegalText } from './actions';
import { LegalPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, LegalText>;

export function LegalForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveLegal('he', data.he);
    await saveLegal('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<LegalText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-8">
        <div className="grid gap-4">
          <TextField label="כותרת: מדיניות פרטיות" value={value.privacyTitle} jump="privacyTitle" onChange={(v) => update({ privacyTitle: v })} />
          <ParagraphListField label="מדיניות פרטיות" values={value.privacy} jump="privacy" rows={3} onChange={(privacy) => update({ privacy })} />
        </div>
        <div className="grid gap-4 border-t border-neutral-200 pt-6">
          <TextField label="כותרת: הצהרת נגישות" value={value.accessibilityTitle} jump="accessibilityTitle" onChange={(v) => update({ accessibilityTitle: v })} />
          <ParagraphListField label="הצהרת נגישות" values={value.accessibility} jump="accessibility" rows={3} onChange={(accessibility) => update({ accessibility })} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<LegalPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
