import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { TeamForm } from './Form';

export default async function TeamAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="team" />
      <TeamForm
        initial={{
          he: content.text.he.team,
          en: content.text.en.team,
          images: content.media.team.members,
        }}
      />
    </div>
  );
}
