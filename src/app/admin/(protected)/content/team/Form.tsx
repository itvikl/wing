'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField, sizeField } from '@/components/admin/fields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveTeam, type TeamText } from './actions';
import { TeamPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Member = TeamText['members'][number];
type Partner = NonNullable<TeamText['partners']>[number];
type Labels = Omit<TeamText, 'members'>;
type Row = { he: Member; en: Member; image: string | null };
type Data = { labels: Record<ContentLocale, Labels>; rows: Row[] };

const BLANK_MEMBER: Member = { name: '', initials: '', role: '', bio: '' };

/** Everything but the members, with the optional fields filled in so every input is controlled. */
function labelsOf(text: TeamText): Labels {
  const { members: _members, ...labels } = text;
  return {
    ...labels,
    intro: labels.intro ?? '',
    whatsappLabel: labels.whatsappLabel ?? '',
    linkedinLabel: labels.linkedinLabel ?? '',
    partnersEyebrow: labels.partnersEyebrow ?? '',
    partnersTitle: labels.partnersTitle ?? '',
    partners: labels.partners ?? [],
    sizes: labels.sizes ?? {},
  };
}

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
        he: labelsOf(initial.he),
        en: labelsOf(initial.en),
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
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} jump="eyebrow" {...sizeField(value.sizes, 'eyebrow', (sizes) => update({ sizes }))} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת" value={value.title} jump="title" {...sizeField(value.sizes, 'title', (sizes) => update({ sizes }))} onChange={(v) => update({ title: v })} />
        <div className="sm:col-span-2">
          <TextAreaField label="משפט פתיחה (לא חובה)" value={value.intro ?? ''} jump="intro" rows={2} onChange={(v) => update({ intro: v })} />
        </div>
        <TextField label="תווית הקישור לוואטסאפ" value={value.whatsappLabel ?? ''} jump="whatsappLabel" onChange={(v) => update({ whatsappLabel: v })} />
        <TextField label="תווית הקישור ל-LinkedIn" value={value.linkedinLabel ?? ''} jump="linkedinLabel" onChange={(v) => update({ linkedinLabel: v })} />

        <div className="mt-4 grid gap-4 border-t border-neutral-200 pt-6 sm:col-span-2">
          <h3 className="text-base font-semibold text-primary-dark">אנשי מקצוע קבועים</h3>
          <p className="-mt-2 text-sm text-neutral-muted">עורך דין, יועץ משכנתאות, שמאי וכו׳. בלי אף אחד ברשימה, האזור לא מוצג באתר.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="תגית עליונה" value={value.partnersEyebrow ?? ''} jump="partnersEyebrow" onChange={(v) => update({ partnersEyebrow: v })} />
            <TextField label="כותרת" value={value.partnersTitle ?? ''} jump="partnersTitle" onChange={(v) => update({ partnersTitle: v })} />
          </div>
          <RepeatableList<Partner>
            items={value.partners ?? []}
            onChange={(partners) => update({ partners })}
            newItem={() => ({ role: '', name: '', url: '' })}
            addLabel="הוספת איש מקצוע"
            confirmRemove="למחוק את איש המקצוע?"
            renderItem={(partner, updatePartner, index) => (
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label="תחום (למשל: עורך דין · מקרקעין)" value={partner.role} jump={`partners.${index}.role`} onChange={(v) => updatePartner({ role: v })} />
                <TextField label="שם / משרד" value={partner.name} jump={`partners.${index}.name`} onChange={(v) => updatePartner({ name: v })} />
                <TextField singleLine label="קישור לאתר (לא חובה)" value={partner.url ?? ''} jump={`partners.${index}.url`} onChange={(v) => updatePartner({ url: v })} />
              </div>
            )}
          />
        </div>
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
          confirmRemove="למחוק את איש הצוות?"
          renderItem={(row, updateRow, index) => (
            <div className="grid gap-4">
              <LocaleTabs
                he={
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="שם מלא" value={row.he.name} jump={`rows.${index}.name`} {...sizeField(row.he.sizes, 'name', (sizes) => updateRow({ he: { ...row.he, sizes } }))} onChange={(v) => updateRow({ he: { ...row.he, name: v } })} />
                    <TextField singleLine label="ראשי תיבות (לעיגול)" value={row.he.initials} jump={`rows.${index}.initials`} onChange={(v) => updateRow({ he: { ...row.he, initials: v } })} />
                    <TextField label="תפקיד" value={row.he.role} jump={`rows.${index}.role`} {...sizeField(row.he.sizes, 'role', (sizes) => updateRow({ he: { ...row.he, sizes } }))} onChange={(v) => updateRow({ he: { ...row.he, role: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="ביוגרפיה" value={row.he.bio} jump={`rows.${index}.bio`} {...sizeField(row.he.sizes, 'bio', (sizes) => updateRow({ he: { ...row.he, sizes } }))} onChange={(v) => updateRow({ he: { ...row.he, bio: v } })} />
                    </div>
                    <TextField label="ותק (למשל: 15 שנים בשוק)" value={row.he.years ?? ''} jump={`rows.${index}.years`} onChange={(v) => updateRow({ he: { ...row.he, years: v } })} />
                    <TextField label="שפות (למשל: עברית · English)" value={row.he.languages ?? ''} jump={`rows.${index}.languages`} onChange={(v) => updateRow({ he: { ...row.he, languages: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="ציטוט אישי (לא חובה)" value={row.he.quote ?? ''} jump={`rows.${index}.quote`} rows={2} onChange={(v) => updateRow({ he: { ...row.he, quote: v } })} />
                    </div>
                  </div>
                }
                en={
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Full name" value={row.en.name} jump={`rows.${index}.name`} {...sizeField(row.en.sizes, 'name', (sizes) => updateRow({ en: { ...row.en, sizes } }))} onChange={(v) => updateRow({ en: { ...row.en, name: v } })} />
                    <TextField singleLine label="Initials" value={row.en.initials} jump={`rows.${index}.initials`} onChange={(v) => updateRow({ en: { ...row.en, initials: v } })} />
                    <TextField label="Role" value={row.en.role} jump={`rows.${index}.role`} {...sizeField(row.en.sizes, 'role', (sizes) => updateRow({ en: { ...row.en, sizes } }))} onChange={(v) => updateRow({ en: { ...row.en, role: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="Bio" value={row.en.bio} jump={`rows.${index}.bio`} {...sizeField(row.en.sizes, 'bio', (sizes) => updateRow({ en: { ...row.en, sizes } }))} onChange={(v) => updateRow({ en: { ...row.en, bio: v } })} />
                    </div>
                    <TextField label="Years (e.g. 15 years in the market)" value={row.en.years ?? ''} jump={`rows.${index}.years`} onChange={(v) => updateRow({ en: { ...row.en, years: v } })} />
                    <TextField label="Languages (e.g. English · עברית)" value={row.en.languages ?? ''} jump={`rows.${index}.languages`} onChange={(v) => updateRow({ en: { ...row.en, languages: v } })} />
                    <div className="sm:col-span-2">
                      <TextAreaField label="Quote (optional)" value={row.en.quote ?? ''} jump={`rows.${index}.quote`} rows={2} onChange={(v) => updateRow({ en: { ...row.en, quote: v } })} />
                    </div>
                  </div>
                }
              />
              <ImageUploadField
                label="תמונת פרופיל"
                folder="team"
                value={row.image ?? ''}
                jump={`rows.${index}.image`}
                onChange={(url) => updateRow({ image: url || null })}
              />
              {/* Links are the same in both languages: written to both. */}
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField singleLine
                  label="וואטסאפ אישי (מספר או קישור wa.me, לא חובה)"
                  value={row.he.whatsapp ?? ''}
                  jump={`rows.${index}.whatsapp`}
                  onChange={(v) => updateRow({ he: { ...row.he, whatsapp: v }, en: { ...row.en, whatsapp: v } })}
                />
                <TextField singleLine
                  label="קישור LinkedIn (לא חובה)"
                  value={row.he.linkedin ?? ''}
                  jump={`rows.${index}.linkedin`}
                  onChange={(v) => updateRow({ he: { ...row.he, linkedin: v }, en: { ...row.en, linkedin: v } })}
                />
              </div>
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
