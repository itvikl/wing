import { getContent } from '@/lib/content/store';
import { AboutForm } from './Form';

export default async function AboutAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">אודות</h1>
      <p className="mt-2 text-neutral-muted">קטע &quot;אודות&quot; בעמוד הבית.</p>
      <AboutForm initial={{ he: content.text.he.about, en: content.text.en.about }} />
    </div>
  );
}
