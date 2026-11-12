import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { LegalForm } from './Form';

export default async function LegalAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="legal" note="הנוסח הוא טיוטה: יש לאשר אותו מול היועץ המשפטי, ולהוסיף להצהרת הנגישות את שם רכז/ת הנגישות ודרכי הקשר אליו." />
      <LegalForm initial={{ he: content.text.he.legal, en: content.text.en.legal }} />
    </div>
  );
}
