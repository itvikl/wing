import { getContent } from '@/lib/content/store';
import { NavForm } from './Form';

export default async function NavAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">תפריט ניווט</h1>
      <p className="mt-2 text-neutral-muted">התוויות בסרגל הניווט העליון.</p>
      <NavForm initial={{ he: content.text.he.nav, en: content.text.en.nav }} />
    </div>
  );
}
