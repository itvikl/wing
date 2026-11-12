import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { WhyUsForm } from './Form';

export default async function WhyUsAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="why-us" />
      <WhyUsForm initial={{ he: content.text.he.whyUs, en: content.text.en.whyUs }} />
    </div>
  );
}
