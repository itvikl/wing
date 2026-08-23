import 'server-only';
import { randomUUID } from 'crypto';
import { adminStorage } from '@/lib/firebase-admin';

const UPLOAD_URL_TTL_MS = 10 * 60 * 1000;

export type UploadTicket = {
  /** Signed URL the browser PUTs the file bytes to directly. */
  uploadUrl: string;
  /** Public download URL to store in content once the PUT succeeds. */
  publicUrl: string;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

/**
 * Mints a V4 signed PUT URL so the browser can upload large media (scroll-world
 * clips run 10-28MB) straight to Storage, bypassing Next's server-action body limit.
 * The client's PUT must send the exact same Content-Type it requested here, or the
 * signature check fails.
 */
export async function createUploadTicket({
  folder,
  filename,
  contentType,
}: {
  folder: string;
  filename: string;
  contentType: string;
}): Promise<UploadTicket> {
  const bucket = adminStorage.bucket();
  const path = `public/content/${folder}/${randomUUID()}-${sanitizeFilename(filename)}`;
  const file = bucket.file(path);

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + UPLOAD_URL_TTL_MS,
    contentType,
  });

  // storage.googleapis.com is the raw GCS API and ignores Firebase Security Rules;
  // the firebasestorage.googleapis.com alt=media endpoint is the one that honors the
  // `public/**` read:true rule, so it's the URL that must actually be stored/served.
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;

  return { uploadUrl, publicUrl };
}
