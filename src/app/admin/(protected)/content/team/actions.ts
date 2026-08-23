'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTeamImages, updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type TeamText = z.infer<typeof TEXT_SECTION_SCHEMAS.team>;

export async function saveTeam(locale: ContentLocale, data: TeamText) {
  await requireAdmin();
  await updateTextSection(locale, 'team', data);
}

export async function saveTeamImages(images: (string | null)[]) {
  await requireAdmin();
  await updateTeamImages(images);
}
