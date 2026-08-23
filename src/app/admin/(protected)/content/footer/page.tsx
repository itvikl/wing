import { getContent } from '@/lib/content/store';
import { FooterForm } from './Form';

export default async function FooterAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">פוטר</h1>
      <p className="mt-2 text-neutral-muted">שורת התחתית באתר, כולל טלפון, וואטסאפ ורשתות חברתיות.</p>
      <FooterForm initial={{ he: content.text.he.footer, en: content.text.en.footer }} />
    </div>
  );
}
