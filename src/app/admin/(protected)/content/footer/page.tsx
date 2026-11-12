import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { FooterForm } from './Form';

export default async function FooterAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="contact" />
      <FooterForm initial={{ he: content.text.he.footer, en: content.text.en.footer }} />
    </div>
  );
}
