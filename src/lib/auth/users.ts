import 'server-only';
import { cache } from 'react';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ROLES, type Role } from './roles';

/**
 * The people who can use the admin, one document per Firebase Auth user
 * (`adminUsers/{uid}`). Firebase holds the login itself (email + password);
 * this holds what the person may do. The users screen writes both, so nobody
 * has to open the Firebase console to add someone.
 */
export type AdminUserRecord = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  /** For a limited editor: the admin sections they may edit. */
  sections: string[];
  disabled: boolean;
  /** Set when an owner chose the password; cleared once the person picks their own. */
  mustChangePassword: boolean;
  createdAt: string;
  createdBy: string;
  lastLoginAt: string;
};

const usersCol = () => adminDb.collection('adminUsers');

/**
 * The addresses in ADMIN_EMAILS (server settings) are always owners, whatever
 * the users screen says, and can't be blocked or removed from it. They are
 * the way back in if every other owner is lost.
 */
export function envOwnerEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEnvOwner(email: string): boolean {
  return envOwnerEmails().includes(email.toLowerCase());
}

function fromDoc(uid: string, data: FirebaseFirestore.DocumentData): AdminUserRecord {
  const role = ROLES.includes(data.role) ? (data.role as Role) : 'limited';
  return {
    uid,
    email: String(data.email ?? ''),
    name: String(data.name ?? ''),
    role,
    sections: Array.isArray(data.sections) ? data.sections.map(String) : [],
    disabled: Boolean(data.disabled),
    mustChangePassword: Boolean(data.mustChangePassword),
    createdAt: String(data.createdAt ?? ''),
    createdBy: String(data.createdBy ?? ''),
    lastLoginAt: String(data.lastLoginAt ?? ''),
  };
}

/** Read once per request: the layout, the page and the nav all ask. */
export const getUserRecord = cache(async (uid: string): Promise<AdminUserRecord | null> => {
  const snap = await usersCol().doc(uid).get();
  return snap.exists ? fromDoc(uid, snap.data()!) : null;
});

export async function listUserRecords(): Promise<AdminUserRecord[]> {
  const snap = await usersCol().get();
  return snap.docs
    .map((doc) => fromDoc(doc.id, doc.data()))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * What a signed-in Firebase user may do here, or null if they may not enter.
 * An ADMIN_EMAILS address is an owner even with no record yet.
 */
export function accessFor(email: string, record: AdminUserRecord | null) {
  if (isEnvOwner(email)) {
    return { role: 'owner' as Role, sections: [], mustChangePassword: record?.mustChangePassword ?? false, envOwner: true };
  }
  if (!record || record.disabled) return null;
  return { role: record.role, sections: record.sections, mustChangePassword: record.mustChangePassword, envOwner: false };
}

/**
 * On each login: an ADMIN_EMAILS owner with no record gets one (so they show
 * up on the users screen), and everyone's last login is noted.
 */
export async function recordLogin(uid: string, email: string, name: string) {
  const now = new Date().toISOString();
  const ref = usersCol().doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ lastLoginAt: now });
  } else if (isEnvOwner(email)) {
    await ref.set({
      email,
      name,
      role: 'owner',
      sections: [],
      disabled: false,
      mustChangePassword: false,
      createdAt: now,
      createdBy: 'server settings',
      lastLoginAt: now,
    });
  }
}

export async function writeUserRecord(uid: string, data: Omit<AdminUserRecord, 'uid'>) {
  await usersCol().doc(uid).set(data);
}

export async function patchUserRecord(uid: string, patch: Partial<Omit<AdminUserRecord, 'uid'>>) {
  await usersCol().doc(uid).set(patch, { merge: true });
}

export async function deleteUserRecord(uid: string) {
  await usersCol().doc(uid).delete();
}

/** Ends every open login of this person: their session cookie fails its next check. */
export async function endSessions(uid: string) {
  await adminAuth.revokeRefreshTokens(uid);
}
