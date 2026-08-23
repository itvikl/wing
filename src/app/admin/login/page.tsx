'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/admin/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload.error === 'not-authorized' ? 'המשתמש הזה אינו מורשה לגשת לפאנל הניהול.' : 'ההתחברות נכשלה.',
        );
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההתחברות נכשלה. בדקו אימייל וסיסמה.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-dark px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-neutral-bg p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-primary-dark">כניסה לפאנל הניהול</h1>
        <p className="mt-1 text-sm text-neutral-muted">Wings — ניהול תוכן האתר</p>

        <div className="mt-6 grid gap-4">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="אימייל"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-primary-dark focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="סיסמה"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-primary-dark focus:border-accent focus:outline-none"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-accent px-8 py-3 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {loading ? 'מתחבר…' : 'התחברות'}
        </button>
      </form>
    </div>
  );
}
