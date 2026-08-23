'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveLeadForm, type LeadFormText } from './actions';
import { LeadFormPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, LeadFormText>;

export function LeadFormForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveLeadForm('he', data.he);
    await saveLeadForm('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<LeadFormText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
        <TextField label="שדה: שם מלא" value={value.name} onChange={(v) => update({ name: v })} />
        <TextField label="שדה: טלפון" value={value.phone} onChange={(v) => update({ phone: v })} />
        <TextField label="שדה: אימייל" value={value.email} onChange={(v) => update({ email: v })} />
        <TextField label="שדה: הודעה" value={value.message} onChange={(v) => update({ message: v })} />
        <TextField label="כפתור שליחה" value={value.submit} onChange={(v) => update({ submit: v })} />
        <TextField label="הודעת הצלחה" value={value.success} onChange={(v) => update({ success: v })} />
        <TextField label="הודעת שגיאה" value={value.error} onChange={(v) => update({ error: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={<LocaleTabs he={fields('he')} en={fields('en')} />}
        preview={<LeadFormPreview data={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
