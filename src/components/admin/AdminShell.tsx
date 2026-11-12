'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AdminNav } from './AdminNav';
import { LogoutButton } from './LogoutButton';

/**
 * The admin's frame: a side menu from md up, and on a phone a top bar whose
 * button opens the same menu as a drawer (it had none at all before, so a
 * phone couldn't leave the screen it landed on).
 */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const menu = (
    <>
      <div className="px-3 text-lg font-semibold text-neutral-100">Wings · ניהול האתר</div>
      <div className="mt-8 flex-1 overflow-y-auto">
        <AdminNav onNavigate={() => setOpen(false)} />
      </div>
      <div className="mt-6 border-t border-white/10 px-3 pt-5">
        <p className="mb-3 truncate text-xs text-neutral-200" dir="ltr">{email}</p>
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-100 md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-white/10 bg-primary-dark px-3 py-6 md:flex">
        {menu}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between bg-primary-dark px-4 py-3 md:hidden">
        <span className="font-semibold text-neutral-100">Wings · ניהול האתר</span>
        <button
          type="button"
          aria-label="פתיחת התפריט"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-100 hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="סגירת התפריט" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside role="dialog" aria-label="תפריט הניהול" className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-primary-dark px-3 py-6 shadow-2xl">
            {menu}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
