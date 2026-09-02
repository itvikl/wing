'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateProjectsSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS } from '@/lib/content/schema';

export type ProjectsText = z.infer<typeof TEXT_SECTION_SCHEMAS.projects>;

export async function saveProjects(he: ProjectsText, en: ProjectsText, images: (string | null)[]) {
  await requireAdmin();
  await updateProjectsSection(he, en, images);
}
