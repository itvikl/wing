'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveVideoText, saveVideoPoster, type VideoText } from './actions';
import { VideoPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = { text: Record<ContentLocale, VideoText>; poster: string };

export function VideoForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveVideoText('he', data.text.he);
    await saveVideoText('en', data.text.en);
    await saveVideoPoster(data.poster);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data.text[locale];
    const update = (patch: Partial<VideoText>) =>
      setData((prev) => ({ ...prev, text: { ...prev.text, [locale]: { ...prev.text[locale], ...patch } } }));
    return (
      <div className="grid gap-4">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
        <TextField label="טקסט קריאה לפעולה" value={value.cta} onChange={(v) => update({ cta: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={
          <div>
            <LocaleTabs he={fields('he')} en={fields('en')} />
            <div className="mt-6">
              <ImageUploadField
                label="תמונת רקע לתצוגה מקדימה"
                folder="video"
                value={data.poster}
                onChange={(url) => setData((prev) => ({ ...prev, poster: url }))}
              />
            </div>
          </div>
        }
        preview={<VideoPreview data={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
