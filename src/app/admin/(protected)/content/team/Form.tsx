'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveTeam, type TeamText } from './actions';
import { TeamPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Member = TeamText['members'][number];
type Labels = Omit<TeamText, 'members'>;
type Row = { he: Member; en: Member; image: string | null };
type Data = { labels: Record<ContentLocale, Labels>; rows: Row[] };

const BLANK_MEMBER: Member = { name: '', initials: '', role: '', bio: '' };

function toRows(he: Member[], en: Member[], images: (string | null)[]): Row[] {
  const length = Math.max(he.length, en.length, images.length);
  return Array.from({ length }, (_, i) => ({
    he: he[i] ?? { ...BLANK_MEMBER },
    en: en[i] ?? { ...BLANK_MEMBER },
    image: images[i] ?? null,
  }));
}

export function TeamForm({
  initial,
}: {
  initial: { he: TeamText; en: TeamText; images: (string | null)[] };
}) {
  async function save(data: Data) {
    await saveTeam(
      { ...data.labels.he, members: data.rows.map((r) => r.he) },
      { ...data.labels.en, members: data.rows.map((r) => r.en) },
      data.rows.map((r) => r.image),
    );
  }

  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm<Data>(
    {
      labels: {
        he: { eyebrow: initial.he.eyebrow, title: initial.he.title },
        en: { eyebrow: initial.en.eyebrow, title: initial.en.title },
      },
      rows: toRows(initial.he.members, initial.en.members, initial.images),
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
      </div>
    );
  }

  const fields = (
    <div>
      <LocaleTabs he={labelFields('he')} en={labelFields('en')} />

      <h2 className="mt-10 text-lg font-semibold text-primary-dark">אנשי צוות</h2>
      <p className="mt-1 text-sm text-neutral-muted">
        כל איש צוות כולל טקסט בשתי השפות ותמונת פרופיל משותפת (אופציונלית) — בלי תמונה יוצג עיגול עם ראשי תיבות.
      </p>

      <div className="mt-4">
        <RepeatableList<Row>
          items={data.rows}
          onChange={(rows) => setData((prev) => ({ ...prev, rows }))}
          newItem={() => ({ he: { ...BLANK_MEMBER }, en: { ...BLANK_MEMBER }, image: null })}
          addLabel="הוספת איש צוות"
          renderItem={(row, updateRow) => (
            <div className="grid gap-4">
              <LocaleTabs
                he={
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="שם מלא" value={row.he.name} onChange={(v) => updateRow({ he: { ...row.he, name: v } })} />
                    <TextField label="ראשי תיבות (לעיגול)" value={row.he.initials} onChange={(v) => updateRow({ he: { ...row.he, initials: v } })} />
                    <TextField label="תפקיד" value={row.he.role} onChange={(v) => updateRow({ he: { ...row.he, role: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="ביוגרפיה" value={row.he.bio} onChange={(v) => updateRow({ he: { ...row.he, bio: v } })} />
                    </div>
                  </div>
                }
                en={
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Full name" value={row.en.name} onChange={(v) => updateRow({ en: { ...row.en, name: v } })} />
                    <TextField label="Initials" value={row.en.initials} onChange={(v) => updateRow({ en: { ...row.en, initials: v } })} />
                    <TextField label="Role" value={row.en.role} onChange={(v) => updateRow({ en: { ...row.en, role: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="Bio" value={row.en.bio} onChange={(v) => updateRow({ en: { ...row.en, bio: v } })} />
                    </div>
                  </div>
                }
              />
              <ImageUploadField
                label="תמונת פרופיל"
                folder="team"
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
      <SectionLayout fields={fields} preview={<TeamPreview labels={data.labels} rows={data.rows} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
