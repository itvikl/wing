'use server';

import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase-admin';
import { requireOwner, type AdminSession } from '@/lib/auth/session';
import { MIN_PASSWORD_LENGTH, OWNER_ONLY_SECTIONS, ROLES, type Role } from '@/lib/auth/roles';
import {
  deleteUserRecord,
  type AdminUserRecord,
  endSessions,
  envOwnerEmails,
  getUserRecord,
  isEnvOwner,
  listUserRecords,
  patchUserRecord,
  writeUserRecord,
} from '@/lib/auth/users';
import { ADMIN_SECTIONS } from '@/lib/admin/sections';

// Owners only. Every action writes the Firebase login and the role record
// together, so nobody needs the Firebase console. Results come back as
// { ok, error }: a production build hides thrown messages.

type Result = { ok: true } | { ok: false; error: string };
const PAGE = '/admin/users';

export type NewUserInput = { name: string; email: string; password: string; role: Role; sections: string[] };
export type UserAccessInput = { name: string; role: Role; sections: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanAccess(input: UserAccessInput): { name: string; role: Role; sections: string[] } | string {
  const name = String(input.name ?? '').trim().slice(0, 80);
  if (!name) return 'חסר שם.';
  if (!ROLES.includes(input.role)) return 'תפקיד לא מוכר.';
  const allowed = ADMIN_SECTIONS.map((s) => s.key).filter((k) => !(OWNER_ONLY_SECTIONS as readonly string[]).includes(k));
  const sections = input.role === 'limited' ? Array.from(new Set(input.sections)).filter((k) => allowed.includes(k)) : [];
  if (input.role === 'limited' && !sections.length) return 'לעורך מוגבל צריך לסמן לפחות חלק אחד.';
  return { name, role: input.role, sections };
}

function checkPassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return `הסיסמה צריכה להיות באורך ${MIN_PASSWORD_LENGTH} תווים לפחות.`;
  if (password.length > 128) return 'הסיסמה ארוכה מדי.';
  return null;
}

/** Owners who can still get in, without `exceptUid`: never let that reach zero. */
async function otherActiveOwners(exceptUid: string): Promise<number> {
  const records = await listUserRecords();
  const fromRecords = records.filter((r) => r.uid !== exceptUid && r.role === 'owner' && !r.disabled && !isEnvOwner(r.email));
  const envOwners = envOwnerEmails().filter((email) => records.find((r) => r.email === email)?.uid !== exceptUid);
  return fromRecords.length + envOwners.length;
}

/** The checks every change to someone else's account shares. */
async function loadTarget(
  me: AdminSession,
  uid: string,
): Promise<{ ok: true; record: AdminUserRecord } | { ok: false; error: string }> {
  if (uid === me.uid) return { ok: false, error: 'את החשבון שלכם אפשר לשנות רק דרך "החלפת סיסמה". תפקיד וחסימה, רק בעלים אחרים.' };
  const record = await getUserRecord(uid);
  if (!record) return { ok: false, error: 'המשתמש לא נמצא. אולי נמחק בחלון אחר.' };
  if (isEnvOwner(record.email)) return { ok: false, error: 'זה בעלים קבוע מהגדרות השרת. אי אפשר לשנות אותו מכאן.' };
  return { ok: true, record };
}

export async function createUserAction(input: NewUserInput): Promise<Result> {
  const me = await requireOwner();
  const email = String(input.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'כתובת המייל לא תקינה.' };
  const access = cleanAccess(input);
  if (typeof access === 'string') return { ok: false, error: access };
  const passwordProblem = checkPassword(input.password);
  if (passwordProblem) return { ok: false, error: passwordProblem };

  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email).catch(() => null);
    if (existing) {
      // Already a Firebase login (say, someone removed earlier): reuse it,
      // unless they're already on the users list.
      if ((await getUserRecord(existing.uid)) || isEnvOwner(email)) {
        return { ok: false, error: 'כבר יש משתמש עם המייל הזה.' };
      }
      await adminAuth.updateUser(existing.uid, { password: input.password, displayName: access.name, disabled: false });
      await endSessions(existing.uid);
      uid = existing.uid;
    } else {
      uid = (await adminAuth.createUser({ email, password: input.password, displayName: access.name })).uid;
    }
  } catch (error) {
    console.error('createUser failed', error);
    return { ok: false, error: 'Firebase לא הצליח לפתוח את המשתמש. בדקו את המייל ונסו סיסמה אחרת.' };
  }

  await writeUserRecord(uid, {
    email,
    ...access,
    disabled: false,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    createdBy: me.email,
    lastLoginAt: '',
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function updateUserAction(uid: string, input: UserAccessInput): Promise<Result> {
  const me = await requireOwner();
  const target = await loadTarget(me, uid);
  if (!target.ok) return target;
  const access = cleanAccess(input);
  if (typeof access === 'string') return { ok: false, error: access };
  if (target.record.role === 'owner' && access.role !== 'owner' && (await otherActiveOwners(uid)) === 0) {
    return { ok: false, error: 'זה הבעלים האחרון. קודם הגדירו בעלים נוסף.' };
  }
  await patchUserRecord(uid, access);
  await adminAuth.updateUser(uid, { displayName: access.name }).catch(() => {});
  revalidatePath(PAGE);
  return { ok: true };
}

/** A new temporary password: their open logins end, and they pick their own on the next one. */
export async function resetPasswordAction(uid: string, password: string): Promise<Result> {
  const me = await requireOwner();
  const target = await loadTarget(me, uid);
  if (!target.ok) return target;
  const passwordProblem = checkPassword(password);
  if (passwordProblem) return { ok: false, error: passwordProblem };
  try {
    await adminAuth.updateUser(uid, { password });
  } catch {
    return { ok: false, error: 'Firebase לא קיבל את הסיסמה. נסו סיסמה אחרת.' };
  }
  await endSessions(uid);
  await patchUserRecord(uid, { mustChangePassword: true });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function setBlockedAction(uid: string, blocked: boolean): Promise<Result> {
  const me = await requireOwner();
  const target = await loadTarget(me, uid);
  if (!target.ok) return target;
  if (blocked && target.record.role === 'owner' && (await otherActiveOwners(uid)) === 0) {
    return { ok: false, error: 'זה הבעלים האחרון. קודם הגדירו בעלים נוסף.' };
  }
  await adminAuth.updateUser(uid, { disabled: blocked });
  if (blocked) await endSessions(uid);
  await patchUserRecord(uid, { disabled: blocked });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function deleteUserAction(uid: string): Promise<Result> {
  const me = await requireOwner();
  const target = await loadTarget(me, uid);
  if (!target.ok) return target;
  if (target.record.role === 'owner' && (await otherActiveOwners(uid)) === 0) {
    return { ok: false, error: 'זה הבעלים האחרון. קודם הגדירו בעלים נוסף.' };
  }
  await adminAuth.deleteUser(uid).catch((error) => {
    if (error?.code !== 'auth/user-not-found') throw error;
  });
  await deleteUserRecord(uid);
  revalidatePath(PAGE);
  return { ok: true };
}
