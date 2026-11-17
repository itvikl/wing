'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { getAdminSession } from '@/lib/auth/session';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/roles';
import { patchUserRecord } from '@/lib/auth/users';

type Result = { ok: true } | { ok: false; error: string };

/**
 * Sets the signed-in person's own password. `proofToken` is the Firebase ID
 * token the browser got by signing in with the current password a moment
 * ago: it proves that password was just typed, so a left-open session alone
 * can't change it.
 */
export async function changeOwnPassword(proofToken: string, next: string): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: 'ההתחברות פגה. התחברו מחדש ונסו שוב.' };

  try {
    const proof = await adminAuth.verifyIdToken(proofToken);
    const fresh = Date.now() - proof.auth_time * 1000 < 5 * 60 * 1000;
    if (proof.uid !== session.uid || !fresh) return { ok: false, error: 'לא הצלחנו לאמת את הסיסמה הנוכחית. נסו שוב.' };
  } catch {
    return { ok: false, error: 'לא הצלחנו לאמת את הסיסמה הנוכחית. נסו שוב.' };
  }

  if (typeof next !== 'string' || next.length < MIN_PASSWORD_LENGTH || next.length > 128) {
    return { ok: false, error: `הסיסמה צריכה להיות באורך ${MIN_PASSWORD_LENGTH} תווים לפחות.` };
  }

  try {
    await adminAuth.updateUser(session.uid, { password: next });
  } catch {
    return { ok: false, error: 'Firebase לא קיבל את הסיסמה. נסו סיסמה ארוכה או מורכבת יותר.' };
  }
  await patchUserRecord(session.uid, { mustChangePassword: false });
  return { ok: true };
}
