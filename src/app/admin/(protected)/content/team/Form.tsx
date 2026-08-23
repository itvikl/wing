'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveTeam, type TeamText } from './actions';
import { TeamPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Member = TeamText['members'][number];
type Data = Record<ContentLocale, TeamText>;

export function TeamForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveTeam('he', data.he);
    await saveTeam('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<TeamText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));

    return (
      <div className="grid gap-6">
        <div className="grid gap-4">
          <TextField label="תגית עליונה (Eyebrow)" value={value.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <TextField label="כותרת" value={value.title} onChange={(v) => update({ title: v })} />
        </div>
        <RepeatableList<Member>
          items={value.members}
          onChange={(members) => update({ members })}
          newItem={() => ({ name: '', initials: '', role: '', bio: '' })}
          addLabel="הוספת איש צוות"
          renderItem={(member, updateItem) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="שם מלא" value={member.name} onChange={(v) => updateItem({ name: v })} />
              <TextField label="ראשי תיבות (לעיגול)" value={member.initials} onChange={(v) => updateItem({ initials: v })} />
              <TextField label="תפקיד" value={member.role} onChange={(v) => updateItem({ role: v })} />
              <div className="sm:col-span-2">
                <TextAreaField label="ביוגרפיה" value={member.bio} onChange={(v) => updateItem({ bio: v })} />
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<TeamPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
