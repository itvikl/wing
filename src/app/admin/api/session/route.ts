import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from '@/lib/auth/session';
import { accessFor, getUserRecord, recordLogin } from '@/lib/auth/users';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;
  if (typeof idToken !== 'string' || !idToken) {
    return NextResponse.json({ error: 'missing-token' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'invalid-token' }, { status: 401 });
  }

  const email = (decoded.email || '').toLowerCase();
  const record = await getUserRecord(decoded.uid);
  if (!email || !accessFor(email, record)) {
    return NextResponse.json({ error: record?.disabled ? 'disabled' : 'not-authorized' }, { status: 403 });
  }

  await recordLogin(decoded.uid, email, (decoded.name as string | undefined) ?? '');
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });

  const response = NextResponse.json({ ok: true, mustChangePassword: record?.mustChangePassword ?? false });
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
