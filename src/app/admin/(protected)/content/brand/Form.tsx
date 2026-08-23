'use client';

import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveBrand } from './actions';
import { BrandPreview } from './Preview';

export function BrandForm({ initialLogo }: { initialLogo: string }) {
  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm(initialLogo, saveBrand);

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={<ImageUploadField label="לוגו" folder="brand" value={data} onChange={setData} />}
        preview={<BrandPreview logo={data} />}
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
