'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type AboutText = z.infer<typeof TEXT_SECTION_SCHEMAS.about>;

export async function saveAbout(locale: ContentLocale, data: AboutText) {
  await requireAdmin();
  await updateTextSection(locale, 'about', data);
}
