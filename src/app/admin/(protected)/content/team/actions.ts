'use server';

import type { z } from 'zod';
import { requireSection } from '@/lib/auth/session';
import { updateTeamSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS } from '@/lib/content/schema';

export type TeamText = z.infer<typeof TEXT_SECTION_SCHEMAS.team>;

export async function saveTeam(he: TeamText, en: TeamText, images: (string | null)[]) {
  await requireSection('team');
  await updateTeamSection(he, en, images);
}
