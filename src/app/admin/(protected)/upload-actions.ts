'use server';

import { requireAdmin } from '@/lib/auth/session';
import { createUploadTicket, type UploadTicket } from '@/lib/content/media';

export async function requestMediaUpload(folder: string, filename: string, contentType: string): Promise<UploadTicket> {
  await requireAdmin();
  return createUploadTicket({ folder, filename, contentType });
}
