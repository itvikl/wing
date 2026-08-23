'use client';

import { useState } from 'react';
import type { ContentLocale } from '@/lib/content/schema';

export function usePreviewLocale() {
  return useState<ContentLocale>('he');
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
