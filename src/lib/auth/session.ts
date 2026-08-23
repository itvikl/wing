import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_MS = 13 * 24 * 60 * 60 * 1000;

export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminSession = { uid: string; email: string };

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    const email = (decoded.email || '').toLowerCase();
    if (!email || !allowedAdminEmails().includes(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}
