import { getContent } from '@/lib/content/store';
import { LegalForm } from './Form';

export default async function LegalAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">פרטיות ונגישות</h1>
      <p className="mt-2 text-neutral-muted">
        מדיניות הפרטיות והצהרת הנגישות, שמקושרות מהפוטר ומהטופס. פסקה שמתחילה ב-&quot;## &quot; מוצגת ככותרת.
        הנוסח הוא טיוטה: יש לאשר אותו מול היועץ המשפטי, ולהוסיף להצהרת הנגישות את שם רכז/ת הנגישות ודרכי הקשר.
      </p>
      <LegalForm initial={{ he: content.text.he.legal, en: content.text.en.legal }} />
    </div>
  );
}
