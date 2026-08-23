'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut(auth).catch(() => {});
      await fetch('/admin/api/session', { method: 'DELETE' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-neutral-100 transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? '…' : 'התנתקות'}
    </button>
  );
}
