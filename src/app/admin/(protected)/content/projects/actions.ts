'use server';

import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProjectsLabels } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS } from '@/lib/content/schema';
import {
  createProject,
  deleteProject,
  duplicateProject,
  importLegacyProjects,
  moveProject,
  saveProject,
  setProjectPublished,
  type SaveResult,
} from '@/lib/projects/store';

export type ProjectsText = z.infer<typeof TEXT_SECTION_SCHEMAS.projects>;
export type ProjectsLabels = Omit<ProjectsText, 'items'>;

// Each store call checks the admin session itself. Results come back as
// { ok, error } rather than thrown: a production build hides a thrown
// message from the browser, and these messages are written for the admin.

const LIST = '/admin/content/projects';

export async function saveProjectsLabels(he: ProjectsLabels, en: ProjectsLabels) {
  await updateProjectsLabels(he, en);
}

export async function saveProjectAction(id: string, data: unknown): Promise<SaveResult> {
  const result = await saveProject(id, data);
  if (result.ok) revalidatePath(LIST);
  return result;
}

export async function setPublishedAction(id: string, published: boolean): Promise<SaveResult> {
  return setProjectPublished(id, published);
}

export async function createProjectAction(): Promise<string> {
  return createProject();
}

export async function duplicateProjectAction(id: string): Promise<string | null> {
  return duplicateProject(id);
}

export async function moveProjectAction(id: string, direction: -1 | 1) {
  await moveProject(id, direction);
}

export async function deleteProjectAction(id: string) {
  await deleteProject(id);
}

export async function importLegacyAction(): Promise<number> {
  return importLegacyProjects();
}
