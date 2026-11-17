'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/roles';
import { changeOwnPassword } from './actions';

const input =
  'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-primary-dark focus:border-accent focus:outline-none';

export function ChangePasswordForm({ email, name, forced }: { email: string; name: string; forced: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (next.length < MIN_PASSWORD_LENGTH) return setError(`הסיסמה החדשה צריכה להיות באורך ${MIN_PASSWORD_LENGTH} תווים לפחות.`);
    if (next !== confirm) return setError('שתי הסיסמאות החדשות לא זהות.');
    if (next === current) return setError('הסיסמה החדשה צריכה להיות שונה מהנוכחית.');

    setLoading(true);
    try {
      // 1) Prove the current password (a fresh sign-in the server checks).
      let proof: string;
      try {
        proof = await (await signInWithEmailAndPassword(auth, email, current)).user.getIdToken();
      } catch {
        throw new Error(forced ? 'הסיסמה הזמנית לא נכונה.' : 'הסיסמה הנוכחית לא נכונה.');
      }
      // 2) Set the new one.
      const result = await changeOwnPassword(proof, next);
      if (!result.ok) throw new Error(result.error);
      // 3) Sign in again with it: a new password can end the old login.
      const token = await (await signInWithEmailAndPassword(auth, email, next)).user.getIdToken();
      const response = await fetch('/admin/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });
      if (!response.ok) throw new Error('הסיסמה הוחלפה, אבל ההתחברות מחדש נכשלה. התחברו עם הסיסמה החדשה.');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההחלפה נכשלה. נסו שוב.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-neutral-bg p-8 shadow-xl">
      <h1 className="text-xl font-semibold text-primary-dark">{forced ? `ברוכים הבאים${name ? `, ${name}` : ''}` : 'החלפת סיסמה'}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-muted">
        {forced
          ? 'נכנסתם עם סיסמה זמנית שקבעו לכם. לפני שממשיכים, בחרו סיסמה משלכם. רק אתם תדעו אותה.'
          : 'הקלידו את הסיסמה הנוכחית ובחרו סיסמה חדשה.'}
      </p>
      <p className="mt-3 truncate text-xs text-neutral-muted" dir="ltr">{email}</p>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-primary-dark">
          {forced ? 'הסיסמה הזמנית' : 'הסיסמה הנוכחית'}
          <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} dir="ltr" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-primary-dark">
          סיסמה חדשה
          <input type={show ? 'text' : 'password'} required autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} value={next} onChange={(e) => setNext(e.target.value)} className={input} dir="ltr" />
          <span className="text-xs font-normal text-neutral-muted">{MIN_PASSWORD_LENGTH} תווים לפחות.</span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-primary-dark">
          הסיסמה החדשה שוב
          <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} dir="ltr" />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-muted">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-accent" />
          הצגת הסיסמאות
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-accent px-8 py-3 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        {loading ? 'שומר…' : 'שמירת הסיסמה'}
      </button>
      {!forced && (
        <Link href="/admin" className="mt-4 block text-center text-sm text-neutral-muted hover:text-primary-dark">
          חזרה לניהול
        </Link>
      )}
    </form>
  );
}
