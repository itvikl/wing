import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { ProjectsForm } from './Form';

export default async function ProjectsAdminPage() {
  const content = await getContent();

  return (
    <div>
      <SectionHeader sectionKey="projects" />
      <ProjectsForm
        initial={{
          he: content.text.he.projects,
          en: content.text.en.projects,
          images: content.media.projects.items,
        }}
      />
    </div>
  );
}
