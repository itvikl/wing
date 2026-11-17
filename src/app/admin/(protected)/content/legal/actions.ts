'use server';

import type { z } from 'zod';
import { requireSection } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type LegalText = z.infer<typeof TEXT_SECTION_SCHEMAS.legal>;

export async function saveLegal(locale: ContentLocale, data: LegalText) {
  await requireSection('legal');
  await updateTextSection(locale, 'legal', data);
}
