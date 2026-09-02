'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveProjects, type ProjectsText } from './actions';
import { ProjectsPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Item = ProjectsText['items'][number];
type Labels = Omit<ProjectsText, 'items'>;
type Row = { he: Item; en: Item; image: string | null };
type Data = { labels: Record<ContentLocale, Labels>; rows: Row[] };

const BLANK_ITEM: Item = { title: '', location: '', description: '' };

function toRows(he: Item[], en: Item[], images: (string | null)[]): Row[] {
  const length = Math.max(he.length, en.length, images.length);
  return Array.from({ length }, (_, i) => ({
    he: he[i] ?? BLANK_ITEM,
    en: en[i] ?? BLANK_ITEM,
    image: images[i] ?? null,
  }));
}

export function ProjectsForm({
  initial,
}: {
  initial: { he: ProjectsText; en: ProjectsText; images: (string | null)[] };
}) {
  async function save(data: Data) {
    await saveProjects(
      { ...data.labels.he, items: data.rows.map((r) => r.he) },
      { ...data.labels.en, items: data.rows.map((r) => r.en) },
      data.rows.map((r) => r.image),
    );
  }

  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm<Data>(
    {
      labels: {
        he: { eyebrow: initial.he.eyebrow, title: initial.he.title, cta: initial.he.cta, viewDetails: initial.he.viewDetails, close: initial.he.close },
        en: { eyebrow: initial.en.eyebrow, title: initial.en.title, cta: initial.en.cta, viewDetails: initial.en.viewDetails, close: initial.en.close },
      },
      rows: toRows(initial.he.items, initial.en.items, initial.images),
    },
    save,
  );

  function labelFields(locale: ContentLocale) {
    const value = data.labels[locale];
    const update = (patch: Partial<Labels>) =>
      setData((prev) => ({ ...prev, labels: { ...prev.labels, [locale]: { ...prev.labels[locale], ...patch } } }));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
        <TextField label="כפתור פנייה" value={value.cta} onChange={(v) => update({ cta: v })} />
        <TextField label="תווית 'לצפייה בפרטים'" value={value.viewDetails} onChange={(v) => update({ viewDetails: v })} />
        <TextField label="תווית 'סגירה'" value={value.close} onChange={(v) => update({ close: v })} />
      </div>
    );
  }

  const fields = (
    <div>
      <LocaleTabs he={labelFields('he')} en={labelFields('en')} />

      <h2 className="mt-10 text-lg font-semibold text-primary-dark">הזדמנויות</h2>
      <p className="mt-1 text-sm text-neutral-muted">כל כרטיס כולל טקסט בשתי השפות ותמונה משותפת (אופציונלית).</p>

      <div className="mt-4">
        <RepeatableList<Row>
          items={data.rows}
          onChange={(rows) => setData((prev) => ({ ...prev, rows }))}
          newItem={() => ({ he: { ...BLANK_ITEM }, en: { ...BLANK_ITEM }, image: null })}
          addLabel="הוספת הזדמנות"
          renderItem={(row, updateRow) => (
            <div className="grid gap-4">
              <LocaleTabs
                he={
                  <div className="grid gap-3">
                    <TextField label="כותרת" value={row.he.title} onChange={(v) => updateRow({ he: { ...row.he, title: v } })} />
                    <TextField label="מיקום" value={row.he.location} onChange={(v) => updateRow({ he: { ...row.he, location: v } })} />
                    <TextAreaField
                      label="תיאור"
                      value={row.he.description}
                      onChange={(v) => updateRow({ he: { ...row.he, description: v } })}
                    />
                  </div>
                }
                en={
                  <div className="grid gap-3">
                    <TextField label="Title" value={row.en.title} onChange={(v) => updateRow({ en: { ...row.en, title: v } })} />
                    <TextField label="Location" value={row.en.location} onChange={(v) => updateRow({ en: { ...row.en, location: v } })} />
                    <TextAreaField
                      label="Description"
                      value={row.en.description}
                      onChange={(v) => updateRow({ en: { ...row.en, description: v } })}
                    />
                  </div>
                }
              />
              <ImageUploadField
                label="תמונה"
                folder="projects"
                value={row.image ?? ''}
                onChange={(url) => updateRow({ image: url || null })}
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={fields} preview={<ProjectsPreview labels={data.labels} rows={data.rows} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
