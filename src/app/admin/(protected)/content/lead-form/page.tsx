import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { LeadFormForm } from './Form';

export default async function LeadFormAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="lead-form" />
      <LeadFormForm initial={{ he: content.text.he.leadForm, en: content.text.en.leadForm }} />
    </div>
  );
}
