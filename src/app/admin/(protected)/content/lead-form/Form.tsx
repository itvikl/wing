'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, sizeField } from '@/components/admin/fields';
import { ParagraphListField } from '@/components/admin/ParagraphListField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveLeadForm, type LeadFormText } from './actions';
import { LeadFormPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, LeadFormText>;

type OptionsKey = 'budgetOptions' | 'timelineOptions' | 'purposeOptions' | 'callTimeOptions';

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
    const text = (key: keyof LeadFormText & string, label: string) => (
      <TextField
        label={label}
        value={value[key] as string}
        jump={key}
        {...sizeField(value.sizes, key, (sizes) => update({ sizes }))}
        onChange={(v) => update({ [key]: v } as Partial<LeadFormText>)}
      />
    );
    // A question's choices: one per line. A question left with no choices is
    // hidden on the site.
    const choices = (key: OptionsKey, label: string) => (
      <ParagraphListField
        label={label}
        values={value[key]}
        jump={key}
        rows={1}
        addLabel="+ הוספת אפשרות"
        onChange={(values) => update({ [key]: values } as Partial<LeadFormText>)}
      />
    );

    return (
      <div className="grid gap-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {text('eyebrow', 'תגית עליונה (Eyebrow)')}
          {text('title', 'כותרת')}
          {text('name', 'שדה: שם מלא')}
          {text('phone', 'שדה: טלפון')}
          {text('country', 'שדה: קידומת מדינה (לקוראי מסך)')}
          {text('email', 'שדה: אימייל')}
          {text('message', 'שדה: הודעה')}
        </div>

        <fieldset className="grid gap-4 border-t border-neutral-200 pt-6">
          <legend className="text-sm font-semibold text-primary-dark">שאלות סינון (לא חובה למילוי באתר)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {text('budget', 'שאלה: תקציב')}
            {choices('budgetOptions', 'אפשרויות תקציב')}
            {text('timeline', 'שאלה: מתי מתכננים לרכוש')}
            {choices('timelineOptions', 'אפשרויות מועד')}
            {text('purpose', 'שאלה: למי הדירה')}
            {choices('purposeOptions', 'אפשרויות מטרה')}
            {text('callTime', 'שאלה: שעה נוחה לשיחה')}
            {choices('callTimeOptions', 'אפשרויות שעה')}
            {text('timezoneNote', 'הערת אזור זמן ({tz} = העיר של הגולש)')}
          </div>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <legend className="text-sm font-semibold text-primary-dark">הסכמה, שליחה ותודה</legend>
          {text('consent', 'תיבת הסכמה לדיוור')}
          {text('submit', 'כפתור שליחה')}
          {text('privacyNote', 'משפט מתחת לכפתור')}
          {text('privacyLink', 'קישור למדיניות הפרטיות')}
          {text('success', 'הודעת הצלחה')}
          {text('successWhatsapp', 'כפתור וואטסאפ בהודעת ההצלחה')}
          {text('error', 'הודעת שגיאה')}
        </fieldset>
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
