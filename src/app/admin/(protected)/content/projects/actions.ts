'use server';

import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSection } from '@/lib/auth/session';
import { canPublish } from '@/lib/auth/roles';
import { updateProjectsLabels } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS } from '@/lib/content/schema';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  importLegacyProjects,
  moveProject,
  saveProject,
  setProjectPublished,
  type SaveResult,
} from '@/lib/projects/store';

export type ProjectsText = z.infer<typeof TEXT_SECTION_SCHEMAS.projects>;
export type ProjectsLabels = Omit<ProjectsText, 'items'>;

// Each action checks the person may edit projects (and, for publishing,
// unpublishing or deleting, that their role allows it); the store checks the
// session again. Results come back as
// { ok, error } rather than thrown: a production build hides a thrown
// message from the browser, and these messages are written for the admin.

const LIST = '/admin/content/projects';
const NO_PUBLISH = 'רק בעלים או עורך יכולים לפרסם, להסתיר או למחוק פרויקט.';

export async function saveProjectsLabels(he: ProjectsLabels, en: ProjectsLabels) {
  await requireSection('projects');
  await updateProjectsLabels(he, en);
}

export async function saveProjectAction(id: string, data: unknown): Promise<SaveResult> {
  const session = await requireSection('projects');
  if (!canPublish(session) && data && typeof data === 'object') {
    // A limited editor's save keeps whatever is live as it is.
    const existing = await getProject(id);
    if (!existing) return { ok: false, error: 'הפרויקט לא נמצא. אולי הוא נמחק בחלון אחר.' };
    data = { ...data, published: existing.published };
  }
  const result = await saveProject(id, data);
  if (result.ok) revalidatePath(LIST);
  return result;
}

export async function setPublishedAction(id: string, published: boolean): Promise<SaveResult> {
  if (!canPublish(await requireSection('projects'))) return { ok: false, error: NO_PUBLISH };
  return setProjectPublished(id, published);
}

export async function createProjectAction(): Promise<string> {
  await requireSection('projects');
  return createProject();
}

export async function duplicateProjectAction(id: string): Promise<string | null> {
  await requireSection('projects');
  return duplicateProject(id);
}

export async function moveProjectAction(id: string, direction: -1 | 1) {
  await requireSection('projects');
  await moveProject(id, direction);
}

export async function deleteProjectAction(id: string) {
  if (!canPublish(await requireSection('projects'))) throw new Error(NO_PUBLISH);
  await deleteProject(id);
}

export async function importLegacyAction(): Promise<number> {
  await requireSection('projects');
  return importLegacyProjects();
}
