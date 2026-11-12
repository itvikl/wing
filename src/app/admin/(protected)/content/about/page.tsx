import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { AboutForm } from './Form';

export default async function AboutAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="about" />
      <AboutForm initial={{ he: content.text.he.about, en: content.text.en.about }} />
    </div>
  );
}
