'use client';

import { Sized } from '@/lib/textSize';
import { Jump } from '@/components/admin/AdminLocale';
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
          <Jump to="rights" as="p">© {new Date().getFullYear()} Wings Real Estate. <Sized scale={value.sizes?.rights}>{value.rights || '—'}</Sized></Jump>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {value.phoneNumber && <Jump to="phoneNumber" as="span" className="font-medium" ><span dir="ltr"><Sized scale={value.sizes?.phone}>{value.phoneNumber}</Sized></span></Jump>}
            {value.whatsappLink && <Jump to="whatsapp" as="span"><Sized scale={value.sizes?.whatsapp}>{value.whatsapp || '—'}</Sized></Jump>}
            {value.emailAddress && <Jump to="emailAddress" as="span" ><span dir="ltr">{value.emailAddress}</span></Jump>}
            {value.facebookUrl && <Jump to="facebookUrl" as="span">Facebook</Jump>}
            {value.instagramUrl && <Jump to="instagramUrl" as="span">Instagram</Jump>}
          </div>
        </div>
      </div>
    </div>
  );
}
