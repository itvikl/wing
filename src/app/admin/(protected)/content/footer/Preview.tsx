'use client';

import { PreviewLocaleToggle, usePreviewLocale } from '@/components/admin/PreviewLocaleToggle';
import type { FooterText } from './actions';
import type { ContentLocale } from '@/lib/content/schema';

export function FooterPreview({ data }: { data: Record<ContentLocale, FooterText> }) {
  const [locale, setLocale] = usePreviewLocale();
  const value = data[locale];

  return (
    <div>
      <PreviewLocaleToggle active={locale} onChange={setLocale} />
      <div dir={locale === 'he' ? 'rtl' : 'ltr'} className="bg-primary-dark p-6 text-xs text-neutral-200">
        <div className="flex flex-col items-center gap-3 text-center">
          <p>© {new Date().getFullYear()} Wings Real Estate. {value.rights || '—'}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {value.phoneNumber && <span>{value.phone || '—'}</span>}
            {value.whatsappLink && <span>{value.whatsapp || '—'}</span>}
            {value.facebookUrl && <span>Facebook</span>}
            {value.instagramUrl && <span>Instagram</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
