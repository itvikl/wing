'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, sizeField } from '@/components/admin/fields';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveNav, type NavText } from './actions';
import { NavPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, NavText>;

export function NavForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveNav('he', data.he);
    await saveNav('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function fields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<NavText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="אודות" value={value.about} jump="about" {...sizeField(value.sizes, 'about', (sizes) => update({ sizes }))} onChange={(v) => update({ about: v })} />
        <TextField label="למה Wings" value={value.advantages} jump="advantages" {...sizeField(value.sizes, 'advantages', (sizes) => update({ sizes }))} onChange={(v) => update({ advantages: v })} />
        <TextField label="הזדמנויות" value={value.projects} jump="projects" {...sizeField(value.sizes, 'projects', (sizes) => update({ sizes }))} onChange={(v) => update({ projects: v })} />
        <TextField label="הצוות" value={value.team} jump="team" {...sizeField(value.sizes, 'team', (sizes) => update({ sizes }))} onChange={(v) => update({ team: v })} />
        <TextField label="צור קשר" value={value.contact} jump="contact" {...sizeField(value.sizes, 'contact', (sizes) => update({ sizes }))} onChange={(v) => update({ contact: v })} />
        <TextField label="כפתור קריאה לפעולה" value={value.cta} jump="cta" {...sizeField(value.sizes, 'cta', (sizes) => update({ sizes }))} onChange={(v) => update({ cta: v })} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout fields={<LocaleTabs he={fields('he')} en={fields('en')} />} preview={<NavPreview data={data} />} />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
