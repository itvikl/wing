'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateSeeWingsMedia, updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale, type SeeWingsMediaSection } from '@/lib/content/schema';

export type SeeWingsText = z.infer<typeof TEXT_SECTION_SCHEMAS.seeWings>;

export async function saveSeeWingsText(locale: ContentLocale, data: SeeWingsText) {
  await requireAdmin();
  await updateTextSection(locale, 'seeWings', data);
}

export async function saveSeeWingsMedia(sections: SeeWingsMediaSection[], connectors: (string | null)[]) {
  await requireAdmin();
  await updateSeeWingsMedia(sections, connectors);
}
