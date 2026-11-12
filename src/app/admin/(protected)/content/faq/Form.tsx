'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveFaq, type FaqText } from './actions';
import { FaqPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Category = FaqText['categories'][number];
type Item = Category['items'][number];
type Data = Record<ContentLocale, FaqText>;

export function FaqForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveFaq('he', data.he);
    await saveFaq('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<FaqText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    const text = (key: Exclude<keyof FaqText, 'categories'>, label: string) => (
      <TextField label={label} value={value[key]} jump={key} onChange={(v) => update({ [key]: v } as Partial<FaqText>)} />
    );

    return (
      <div className="grid gap-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {text('eyebrow', 'תגית עליונה (Eyebrow)')}
          {text('title', 'כותרת העמוד')}
          <div className="sm:col-span-2">
            <TextAreaField label="משפט פתיחה" value={value.intro} jump="intro" rows={2} onChange={(v) => update({ intro: v })} />
          </div>
          {text('allLabel', 'כפתור "הכול" בסינון')}
          {text('navLabel', 'שם העמוד (בפוטר ובלשונית הדפדפן)')}
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h2 className="mb-1 text-base font-semibold text-primary-dark">נושאים ושאלות</h2>
          <p className="mb-4 text-sm text-neutral-muted">נושא בלי שם, או שאלה בלי טקסט, לא מוצגים באתר.</p>
          <RepeatableList<Category>
            items={value.categories}
            onChange={(categories) => update({ categories })}
            newItem={() => ({ name: '', items: [{ q: '', a: '' }] })}
            addLabel="הוספת נושא"
            removeLabel="מחיקת הנושא"
            confirmRemove="למחוק את הנושא וכל השאלות שבו?"
            renderItem={(category, updateCategory, ci) => (
              <div className="grid gap-4">
                <TextField label="שם הנושא" value={category.name} jump={`categories.${ci}.name`} onChange={(v) => updateCategory({ name: v })} />
                <RepeatableList<Item>
                  items={category.items}
                  onChange={(items) => updateCategory({ items })}
                  newItem={() => ({ q: '', a: '' })}
                  addLabel="הוספת שאלה"
                  removeLabel="מחיקת השאלה"
                  confirmRemove="למחוק את השאלה?"
                  renderItem={(item, updateItem, qi) => (
                    <div className="grid gap-3">
                      <TextField label="שאלה" value={item.q} jump={`categories.${ci}.items.${qi}.q`} onChange={(v) => updateItem({ q: v })} />
                      <TextAreaField label="תשובה" value={item.a} jump={`categories.${ci}.items.${qi}.a`} rows={4} onChange={(v) => updateItem({ a: v })} />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>

        <fieldset className="grid gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <legend className="text-base font-semibold text-primary-dark">הכרטיס שבצד: &quot;עדיין יש שאלה?&quot;</legend>
          {text('asideEyebrow', 'תגית עליונה')}
          {text('asideTitle', 'כותרת')}
          <div className="sm:col-span-2">
            <TextAreaField label="טקסט" value={value.asideBody} jump="asideBody" rows={2} onChange={(v) => update({ asideBody: v })} />
          </div>
          {text('asideWhatsapp', 'כפתור וואטסאפ')}
          {text('asideCall', 'כפתור תיאום שיחה')}
        </fieldset>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<FaqPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
