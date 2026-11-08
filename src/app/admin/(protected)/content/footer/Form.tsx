'use client';

import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField } from '@/components/admin/fields';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveFooter, type FooterText } from './actions';
import { FooterPreview } from './Preview';
import type { ContentLocale } from '@/lib/content/schema';

type Data = Record<ContentLocale, FooterText>;

export function FooterForm({ initial }: { initial: Data }) {
  async function save(data: Data) {
    await saveFooter('he', data.he);
    await saveFooter('en', data.en);
  }
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initial, save);

  function localizedFields(locale: ContentLocale) {
    const value = data[locale];
    const update = (patch: Partial<FooterText>) =>
      setData((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="טקסט זכויות יוצרים" value={value.rights} jump="rights" onChange={(v) => update({ rights: v })} />
        <TextField label="תווית 'טלפון'" value={value.phone} jump="phone" onChange={(v) => update({ phone: v })} />
        <TextField label="תווית 'וואטסאפ'" value={value.whatsapp} jump="whatsapp" onChange={(v) => update({ whatsapp: v })} />
      </div>
    );
  }

  // Links aren't language-specific — one shared set applied to both locale objects.
  const links = data.he;
  function updateLink(patch: Partial<FooterText>) {
    setData((prev) => ({
      he: { ...prev.he, ...patch },
      en: { ...prev.en, ...patch },
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={
          <div>
            <LocaleTabs he={localizedFields('he')} en={localizedFields('en')} />

            <div className="mt-8 grid gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
              <TextField
                label="מספר טלפון (tel:)"
                value={links.phoneNumber} jump="phoneNumber"
                onChange={(v) => updateLink({ phoneNumber: v })}
              />
              <TextField
                label="קישור וואטסאפ (https://wa.me/...)"
                value={links.whatsappLink} jump="whatsappLink"
                onChange={(v) => updateLink({ whatsappLink: v })}
              />
              <TextField
                label="קישור פייסבוק"
                value={links.facebookUrl} jump="facebookUrl"
                onChange={(v) => updateLink({ facebookUrl: v })}
              />
              <TextField
                label="קישור אינסטגרם"
                value={links.instagramUrl} jump="instagramUrl"
                onChange={(v) => updateLink({ instagramUrl: v })}
              />
            </div>
          </div>
        }
        preview={<FooterPreview data={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
