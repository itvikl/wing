import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { NavForm } from './Form';

export default async function NavAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="nav" />
      <NavForm initial={{ he: content.text.he.nav, en: content.text.en.nav }} />
    </div>
  );
}
