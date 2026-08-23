'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection, updateVideoPoster } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type VideoText = z.infer<typeof TEXT_SECTION_SCHEMAS.video>;

export async function saveVideoText(locale: ContentLocale, data: VideoText) {
  await requireAdmin();
  await updateTextSection(locale, 'video', data);
}

export async function saveVideoPoster(poster: string) {
  await requireAdmin();
  await updateVideoPoster(poster);
}
