import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { BrandForm } from './Form';

export default async function BrandAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="brand" />
      <BrandForm initialLogo={content.media.logo} />
    </div>
  );
}
