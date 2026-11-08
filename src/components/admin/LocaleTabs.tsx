'use client';

import type { ReactNode } from 'react';
import { useAdminLocale } from './AdminLocale';

/**
 * Both languages' fields, showing the one being edited. Inside the admin the
 * language is screen-wide (AdminLocaleToggle) and these tabs aren't drawn;
 * they only appear where there's no shared switch.
 */
export function LocaleTabs({ en, he }: { en: ReactNode; he: ReactNode }) {
  const { locale: active, setLocale: setActive, shared } = useAdminLocale();

  return (
    <div>
      {!shared && (
        <div className="mb-4 flex gap-2">
          <TabButton active={active === 'he'} onClick={() => setActive('he')} label="עברית" />
          <TabButton active={active === 'en'} onClick={() => setActive('en')} label="English" />
        </div>
      )}
      <div dir="rtl" data-locale="he" hidden={active !== 'he'}>
        {he}
      </div>
      <div dir="ltr" data-locale="en" hidden={active !== 'en'}>
        {en}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        active ? 'bg-primary-dark text-neutral-100' : 'bg-neutral-100 text-neutral-muted hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}
