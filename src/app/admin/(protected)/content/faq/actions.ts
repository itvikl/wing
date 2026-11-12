'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type FaqText = z.infer<typeof TEXT_SECTION_SCHEMAS.faq>;

export async function saveFaq(locale: ContentLocale, data: FaqText) {
  await requireAdmin();
  await updateTextSection(locale, 'faq', data);
}
