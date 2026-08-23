import { getContent } from '@/lib/content/store';
import { ProjectsForm } from './Form';

export default async function ProjectsAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">הזדמנויות</h1>
      <p className="mt-2 text-neutral-muted">כרטיסי ההזדמנויות המוצגים בגלריה ועל המפה.</p>
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
