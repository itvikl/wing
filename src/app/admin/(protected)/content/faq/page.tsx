import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { FaqForm } from './Form';

export default async function FaqAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="faq" note="תשובות על מיסוי, משכנתא וייפוי כוח כדאי לאשר מול עורך הדין לפני פרסום." />
      <FaqForm initial={{ he: content.text.he.faq, en: content.text.en.faq }} />
    </div>
  );
}
