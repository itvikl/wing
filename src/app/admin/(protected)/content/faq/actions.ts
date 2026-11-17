'use server';

import type { z } from 'zod';
import { requireSection } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type FaqText = z.infer<typeof TEXT_SECTION_SCHEMAS.faq>;

export async function saveFaq(locale: ContentLocale, data: FaqText) {
  await requireSection('faq');
  await updateTextSection(locale, 'faq', data);
}
