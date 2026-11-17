import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { canEditSection, canManageUsers, type Role } from './roles';
import { accessFor, getUserRecord } from './users';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_MS = 13 * 24 * 60 * 60 * 1000;

export type AdminSession = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  sections: string[];
  /** Signed in with a password an owner chose: must pick their own before anything else. */
  mustChangePassword: boolean;
  /** Listed in ADMIN_EMAILS: always an owner, can't be changed from the users screen. */
  envOwner: boolean;
};

/**
 * The signed-in admin user, or null. The role is read fresh on every request
 * (not baked into the login), so a changed role or a block applies at once.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    const email = (decoded.email || '').toLowerCase();
    if (!email) return null;
    const record = await getUserRecord(decoded.uid);
    const access = accessFor(email, record);
    if (!access) return null;
    return { uid: decoded.uid, email, name: record?.name || '', ...access };
  } catch {
    return null;
  }
});

/** A signed-in user who may work in the admin (their own password already chosen). */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.mustChangePassword) redirect('/admin/change-password');
  return session;
}

/** requireAdmin, and allowed to edit this admin section (a key from ADMIN_GROUPS). */
export async function requireSection(sectionKey: string): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!canEditSection(session, sectionKey)) redirect('/admin?denied=1');
  return session;
}

export async function requireOwner(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!canManageUsers(session)) redirect('/admin?denied=1');
  return session;
}
