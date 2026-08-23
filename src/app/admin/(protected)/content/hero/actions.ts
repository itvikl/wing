'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type HeroText = z.infer<typeof TEXT_SECTION_SCHEMAS.hero>;

export async function saveHero(locale: ContentLocale, data: HeroText) {
  await requireAdmin();
  await updateTextSection(locale, 'hero', data);
}
