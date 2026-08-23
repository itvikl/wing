import { getContent } from '@/lib/content/store';
import { LeadFormForm } from './Form';

export default async function LeadFormAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">טופס יצירת קשר</h1>
      <p className="mt-2 text-neutral-muted">התוויות של טופס &quot;בקשו גישה פרטית&quot;.</p>
      <LeadFormForm initial={{ he: content.text.he.leadForm, en: content.text.en.leadForm }} />
    </div>
  );
}
