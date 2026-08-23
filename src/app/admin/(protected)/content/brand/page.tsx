import { getContent } from '@/lib/content/store';
import { BrandForm } from './Form';

export default async function BrandAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">מיתוג — לוגו</h1>
      <p className="mt-2 text-neutral-muted">הלוגו המוצג בראש כל עמודי האתר.</p>
      <BrandForm initialLogo={content.media.logo} />
    </div>
  );
}
