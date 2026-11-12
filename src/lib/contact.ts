// Contact links shared by the footer, the header, the flight's topbar and the
// floating WhatsApp button. The numbers themselves live in the admin's Footer
// section (one set for both languages).

/** `tel:` link for a number typed any way ("+972 50-123 4567" → "tel:+972501234567"). */
export function telHref(number: string): string {
  const cleaned = number.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

/**
 * An Israeli number as people read it: "+972584121366" → "+972 58-412-1366",
 * "+97225550123" → "+972 2-555-0123". Anything else comes back as typed.
 */
export function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('972') && (digits.length === 12 || digits.length === 11)) {
    const national = digits.slice(3);
    const area = national.length === 9 ? national.slice(0, 2) : national.slice(0, 1);
    const rest = national.slice(area.length);
    return `+972 ${area}-${rest.slice(0, 3)}-${rest.slice(3)}`;
  }
  return number.trim();
}

/**
 * The admin's WhatsApp link with a first line already typed in, so the chat
 * opens ready to send. A link that already carries its own text keeps it.
 */
export function whatsappHref(link: string, message?: string): string {
  const base = link.trim();
  if (!base) return '';
  if (!message || /[?&]text=/.test(base)) return base;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
}

/** Path on the site for a locale (English has no prefix). */
export function localePath(locale: string, path: string): string {
  return locale === 'en' ? path : `/${locale}${path}`;
}
