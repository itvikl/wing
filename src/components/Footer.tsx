import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText } from '@/lib/content/store';
import type { ContentLocale } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { localePath, telHref, whatsappHref } from '@/lib/contact';
import { MailGlyph, PhoneGlyph, WhatsAppGlyph } from './icons';

export async function Footer() {
  const t = await getTranslations('footer');
  const legal = await getTranslations('legal');
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const phoneNumber = t('phoneNumber');
  const whatsappLink = whatsappHref(t('whatsappLink'), t('whatsappMessage'));
  const emailAddress = t('emailAddress');
  const facebookUrl = t('facebookUrl');
  const instagramUrl = t('instagramUrl');
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = (await getLocaleText(locale as ContentLocale)).footer.sizes;

  const contact = 'inline-flex items-center gap-2 hover:text-accent-light';

  return (
    <footer className="bg-primary-dark text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 pb-24 pt-10 text-base text-neutral-200 md:flex-row md:justify-between">
        {/* pb-24: clear of the floating WhatsApp button, which sits over this corner. */}
        {/* Shown as the number itself, not a "Phone" label: a buyer abroad
            often writes it down or dials from another device. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {phoneNumber && (
            <a href={telHref(phoneNumber)} className={contact} aria-label={`${t('phone')}: ${phoneNumber}`}>
              <PhoneGlyph className="h-4 w-4 text-accent-light" />
              <Sized scale={sizes?.phone}>
                <span dir="ltr">{phoneNumber}</span>
              </Sized>
            </a>
          )}
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={contact}>
              <WhatsAppGlyph className="h-4 w-4 text-accent-light" />
              <Sized scale={sizes?.whatsapp}>{t('whatsapp')}</Sized>
            </a>
          )}
          {emailAddress && (
            <a href={`mailto:${emailAddress}`} className={contact} aria-label={`${t('email')}: ${emailAddress}`}>
              <MailGlyph className="h-4 w-4 text-accent-light" />
              <span dir="ltr">{emailAddress}</span>
            </a>
          )}
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent-light">
              Facebook
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent-light">
              Instagram
            </a>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-sm text-neutral-200/80 md:items-end">
          <nav className="flex gap-4">
            <a href={localePath(locale, '/privacy')} className="hover:text-accent-light">{legal('privacyTitle')}</a>
            <a href={localePath(locale, '/accessibility')} className="hover:text-accent-light">{legal('accessibilityTitle')}</a>
          </nav>
          <p>
            <Sized scale={sizes?.rights}>
              &copy; {year} Wings Real Estate. {t('rights')}
            </Sized>
          </p>
        </div>
      </div>
    </footer>
  );
}
