import { getContent } from '@/lib/content/store';
import { WhyUsForm } from './Form';

export default async function WhyUsAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">למה Wings</h1>
      <p className="mt-2 text-neutral-muted">רשימת היתרונות המוצגת באתר.</p>
      <WhyUsForm initial={{ he: content.text.he.whyUs, en: content.text.en.whyUs }} />
    </div>
  );
}
