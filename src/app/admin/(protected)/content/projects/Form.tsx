'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { AdminLocaleToggle } from '@/components/admin/AdminLocale';
import { TextField, sizeField } from '@/components/admin/fields';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveProjectsLabels, type ProjectsLabels } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, ProjectsLabels>;

/** The template's fixed words, field by field: [key, label]. */
const PAGE_FIELDS: [keyof ProjectsLabels, string][] = [
  ['pageBack', 'קישור חזרה לכל הפרויקטים'],
  ['pageFeaturesEyebrow', 'מאפיינים: תגית עליונה'],
  ['pageFeaturesTitle', 'מאפיינים: כותרת'],
  ['pageNearbyEyebrow', 'בסביבה: תגית עליונה'],
  ['pageNearbyTitle', 'בסביבה: כותרת'],
  ['pageWalk', 'אחרי הדקות: ברגל'],
  ['pageDrive', 'אחרי הדקות: ברכב'],
  ['pageGalleryEyebrow', 'גלריה: תגית עליונה'],
  ['pageGalleryTitle', 'גלריה: כותרת'],
  ['pageLeadEyebrow', 'טופס הפנייה: תגית עליונה'],
  ['pageLeadSubmit', "טופס הפנייה: הכפתור"],
  ['pageSold', 'התגית "נמכר"'],
  ['pageSoldTitle', 'פרויקט שנמכר: כותרת'],
  ['pageSoldBody', 'פרויקט שנמכר: טקסט'],
  ['pageSoldCta', 'פרויקט שנמכר: קישור לכל הפרויקטים'],
  ['pageQuickTitle', "טופס קצר על התמונה: כותרת"],
  ['pageQuickText', "טופס קצר על התמונה: טקסט"],
  ['pageQuickSent', "טופס קצר: אחרי שליחה"],
  ['pageStatusEyebrow', "מצב השיווק: תגית עליונה"],
  ['pageStatusUpdated', "מצב השיווק: \"עודכן לאחרונה\""],
  ['pageUnitsEyebrow', "סוגי דירות: תגית עליונה"],
  ['pageUnitsTitle', "סוגי דירות: כותרת"],
  ['pageUnitsLeft', "סוגי דירות: כמה נותרו ({n} הוא המספר)"],
  ['pageUnitsSoldOut', "סוגי דירות: כשלא נותרו"],
  ['pageUnitsTotal', "סוגי דירות: כמה בפרויקט ({n} הוא המספר)"],
  ['pageSqm', "יחידת השטח"],
  ['pageFloor', "קומה (אחת)"],
  ['pageFloors', "קומות (טווח)"],
  ['pagePlanNote', "תוכנית: הערה בתחתית"],
  ['pagePlanCta', "תוכנית: קישור לטופס"],
  ['pagePlanSoon', "תוכנית: כשאין עדיין תמונה"],
  ['pageBarCta', "טלפון, סרגל תחתון: הכפתור"],
  ['pageShare', "טלפון, סרגל תחתון: שיתוף"],
  ['pageShared', "אחרי העתקת הקישור"],
];

/**
 * The projects section's own words: the heading over the cards, and the
 * labels every project page shares. The projects themselves are edited one
 * by one, each on its own screen.
 */
export function ProjectsLabelsForm({ initial }: { initial: Data }) {
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm<Data>(initial, (d) => saveProjectsLabels(d.he, d.en));

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<ProjectsLabels>) => setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    const sizes = (key: string) => sizeField(value.sizes, key, (s) => update({ sizes: s }));
    return (
      <div className="grid gap-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-primary-dark">עמוד כל הפרויקטים</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} {...sizes('eyebrow')} onChange={(v) => update({ eyebrow: v })} />
            <TextField label="כותרת" value={value.title} {...sizes('title')} onChange={(v) => update({ title: v })} />
            <TextField label="הכפתור על כל כרטיס" value={value.viewDetails} {...sizes('viewDetails')} onChange={(v) => update({ viewDetails: v })} />
            <TextField label="הודעה כשאין פרויקטים מפורסמים" value={value.empty ?? ''} {...sizes('empty')} onChange={(v) => update({ empty: v })} />
            <TextField label="סגירת תמונה מוגדלת (לקוראי מסך)" value={value.close} singleLine onChange={(v) => update({ close: v })} />
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-primary-dark">מילים קבועות בכל דף פרויקט</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {PAGE_FIELDS.map(([key, label]) => (
              <TextField key={key} label={label} value={(value[key] as string | undefined) ?? ''} singleLine onChange={(v) => update({ [key]: v } as Partial<ProjectsLabels>)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <AdminLocaleToggle />
      <LocaleTabs he={fields('he')} en={fields('en')} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
