'use client';

import type { ContentLocale } from '@/lib/content/schema';
import { useAdminLocale } from './AdminLocale';

/** The preview follows the screen's editing language (see AdminLocale). */
export function usePreviewLocale() {
  const { locale, setLocale } = useAdminLocale();
  return [locale, setLocale] as const;
}

export function PreviewLocaleToggle({
  active,
  onChange,
}: {
  active: ContentLocale;
  onChange: (locale: ContentLocale) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-neutral-200 bg-white p-2">
      {(['he', 'en'] as const).map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            active === locale ? 'bg-primary-dark text-neutral-100' : 'text-neutral-muted hover:bg-neutral-100'
          }`}
        >
          {locale === 'he' ? 'עברית' : 'English'}
        </button>
      ))}
    </div>
  );
}
