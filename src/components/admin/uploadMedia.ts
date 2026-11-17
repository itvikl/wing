'use client';

import { requestMediaUpload } from '@/app/admin/(protected)/upload-actions';

/**
 * Sends one file to Storage and returns its public URL: the server signs an
 * upload (checking the admin session), then the browser PUTs the bytes
 * straight to Storage. Each way it can fail says which step failed, since
 * "upload failed" alone can't tell an expired login from a blocked address
 * from a rejected file.
 */
export async function uploadMedia(folder: string, file: File): Promise<string> {
  // A file the system has no type for (some phone formats) would be signed
  // for an empty type the browser then doesn't send, and Storage would refuse
  // the signature. Sign and send the same explicit type instead.
  const contentType = file.type || 'application/octet-stream';

  let ticket: Awaited<ReturnType<typeof requestMediaUpload>>;
  try {
    ticket = await requestMediaUpload(folder, file.name, contentType);
  } catch (error) {
    console.error('Upload: signing failed', error);
    throw new Error('השרת לא אישר את ההעלאה. אולי פג תוקף ההתחברות: רעננו את הדף או התחברו מחדש.');
  }

  let response: Response;
  try {
    response = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  } catch (error) {
    // fetch only throws (rather than returning a status) when the browser
    // refused the request itself: a blocked address (CORS) or no connection.
    console.error('Upload: the browser blocked the request', error);
    throw new Error(`הדפדפן חסם את ההעלאה מהכתובת ${window.location.origin}. אם זו לא הכתובת הרגילה של האתר, היא צריכה אישור בהגדרות האחסון. או שאין חיבור לאינטרנט.`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`Upload: Storage answered ${response.status}`, detail);
    throw new Error(`האחסון דחה את הקובץ (קוד ${response.status}). נסו שוב, או קובץ אחר בפורמט JPG או PNG.`);
  }

  return ticket.publicUrl;
}
