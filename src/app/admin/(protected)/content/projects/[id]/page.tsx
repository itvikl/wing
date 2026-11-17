import { notFound } from 'next/navigation';
import { getLocaleText } from '@/lib/content/store';
import { getProject } from '@/lib/projects/store';
import { projectPageLabels } from '@/components/project/ProjectPage';
import { ProjectEditor, type LeadPreviewLabels } from './Editor';

export default async function ProjectEditorPage({ params: { id } }: { params: { id: string } }) {
  const [project, he, en] = await Promise.all([getProject(id), getLocaleText('he'), getLocaleText('en')]);
  if (!project) notFound();

  const { id: _id, order: _order, updatedAt, ...data } = project;
  const lead = (t: typeof he): LeadPreviewLabels => ({
    name: t.leadForm.name,
    phone: t.leadForm.phone,
    email: t.leadForm.email,
    submit: t.leadForm.submit,
  });

  return (
    <ProjectEditor
      id={id}
      initial={data}
      updatedAt={updatedAt}
      labels={{ he: projectPageLabels(he), en: projectPageLabels(en) }}
      lead={{ he: lead(he), en: lead(en) }}
    />
  );
}
