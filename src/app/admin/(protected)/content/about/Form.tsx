'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField, sizeField } from '@/components/admin/fields';
import { ParagraphListField } from '@/components/admin/ParagraphListField';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveAbout, type AboutText } from './actions';
import { AboutPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, AboutText>;
type Key = Exclude<keyof AboutText, 'body' | 'story' | 'sizes' | 'photo'>;

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 border-t border-neutral-200 pt-6 first:border-t-0 first:pt-0">
      <legend className="text-base font-semibold text-primary-dark">{title}</legend>
      {note && <p className="-mt-2 text-sm text-neutral-muted">{note}</p>}
      {children}
    </fieldset>
  );
}

export function AboutForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveAbout('he', data.he);
    await saveAbout('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<AboutText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    const text = (key: Key, label: string, sized = false) => (
      <TextField
        label={label}
        value={value[key]}
        jump={key}
        {...(sized ? sizeField(value.sizes, key, (sizes) => update({ sizes })) : {})}
        onChange={(v) => update({ [key]: v } as Partial<AboutText>)}
      />
    );
    const area = (key: Key, label: string) => (
      <TextAreaField label={label} value={value[key]} jump={key} rows={2} onChange={(v) => update({ [key]: v } as Partial<AboutText>)} />
    );

    return (
      <div className="grid gap-8">
        <Group title="1 · מאיפה השם">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('eyebrow', 'תגית עליונה', true)}
            {text('title', 'כותרת ראשית', true)}
          </div>
          <ParagraphListField label="הפסוק (שורה בכל תיבה)" values={value.body} jump="body" rows={1} addLabel="+ הוספת שורה" {...sizeField(value.sizes, 'body', (sizes) => update({ sizes }))} onChange={(body) => update({ body })} />
          <div className="grid gap-4 sm:grid-cols-2">
            {text('verseSource', 'מקור הפסוק')}
            {text('verseTranslation', 'תרגום הפסוק')}
          </div>
          {area('nameLine', 'משפט שמחבר את הפסוק לעסק')}
        </Group>

        <Group title="2 · איך הכול התחיל" note="סיפור ההקמה של השותפים, כטקסט רציף. כאן לא נכנסים פרופילים אישיים, הם בעמוד הצוות.">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('storyEyebrow', 'תגית עליונה')}
            {text('storyTitle', 'כותרת')}
          </div>
          <ParagraphListField label="הסיפור (פסקה בכל תיבה)" values={value.story} jump="story" rows={3} onChange={(story) => update({ story })} />
          {area('storyClosing', 'משפט סיום מודגש')}
        </Group>

        <Group title="3 · תמונה משותפת" note="התמונה משותפת לשתי השפות. בלי תמונה, האזור לא מוצג (הקישור לעמוד הצוות נשאר).">
          <ImageUploadField
            label="תמונה של השותפים יחד"
            folder="about"
            value={value.photo}
            jump="photo"
            onChange={(url) => setData((prev) => ({ he: { ...prev.he, photo: url }, en: { ...prev.en, photo: url } }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {text('photoCaption', 'כיתוב לתמונה')}
            {text('teamLink', 'קישור לעמוד הצוות')}
          </div>
        </Group>

        <Group title="4 · המשימה">
          {text('missionEyebrow', 'תגית עליונה')}
          {area('mission', 'המשימה, במשפט אחד')}
        </Group>

        <Group title="5 · עובדות על החברה" note="ערך ריק לא מוצג באתר.">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('foundedLabel', 'תווית: נוסדה')}
            {text('founded', 'שנת הקמה')}
            {text('officeLabel', 'תווית: המשרד')}
            {text('office', 'כתובת המשרד')}
            {text('licenseLabel', 'תווית: רישיון')}
            {text('license', 'מספר רישיון תיווך')}
          </div>
        </Group>

        <Group title="6 · סיום">
          <div className="grid gap-4 sm:grid-cols-3">
            {text('closingTitle', 'כותרת')}
            {text('closingCall', 'כפתור תיאום שיחה')}
            {text('closingWhy', 'קישור ללמה Wings')}
          </div>
        </Group>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<AboutPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
