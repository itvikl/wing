import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('footer');
  const year = new Date().getFullYear();
  const phoneNumber = t('phoneNumber');
  const whatsappLink = t('whatsappLink');
  const facebookUrl = t('facebookUrl');
  const instagramUrl = t('instagramUrl');

  return (
    <footer className="bg-primary-dark text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-neutral-200 md:flex-row md:justify-between">
        <p>&copy; {year} Wings Real Estate. {t('rights')}</p>
        <div className="flex items-center gap-6">
          {phoneNumber && (
            <a href={`tel:${phoneNumber}`} className="hover:text-accent-light">
              {t('phone')}
            </a>
          )}
          {whatsappLink && (
            <a href={whatsappLink} className="hover:text-accent-light">
              {t('whatsapp')}
            </a>
          )}
          {facebookUrl && (
            <a href={facebookUrl} aria-label="Facebook" className="hover:text-accent-light">
              Facebook
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} aria-label="Instagram" className="hover:text-accent-light">
              Instagram
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
