'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateProjectImages, updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type ProjectsText = z.infer<typeof TEXT_SECTION_SCHEMAS.projects>;

export async function saveProjectsText(locale: ContentLocale, data: ProjectsText) {
  await requireAdmin();
  await updateTextSection(locale, 'projects', data);
}

export async function saveProjectImages(images: (string | null)[]) {
  await requireAdmin();
  await updateProjectImages(images);
}
