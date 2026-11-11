/**
 * Dial codes for the lead form's phone field: the countries buyers come from
 * most first, then the rest by ISO code. Shown as "US +1" — a compact label
 * that reads the same in both languages and renders identically on the
 * server and in the browser (Intl.DisplayNames names differ between them).
 * A visitor from anywhere else can type the full number starting with "+".
 */
export const DIAL_CODES: readonly (readonly [iso: string, code: string])[] = [
  ['US', '1'],
  ['IL', '972'],
  ['CA', '1'],
  ['GB', '44'],
  ['FR', '33'],
  ['AU', '61'],
  ['ZA', '27'],
  ['AE', '971'],
  ['AR', '54'],
  ['AT', '43'],
  ['BE', '32'],
  ['BR', '55'],
  ['CH', '41'],
  ['CL', '56'],
  ['CO', '57'],
  ['CY', '357'],
  ['CZ', '420'],
  ['DE', '49'],
  ['DK', '45'],
  ['ES', '34'],
  ['FI', '358'],
  ['GE', '995'],
  ['GR', '30'],
  ['HK', '852'],
  ['HU', '36'],
  ['IE', '353'],
  ['IN', '91'],
  ['IT', '39'],
  ['JP', '81'],
  ['MA', '212'],
  ['MX', '52'],
  ['NL', '31'],
  ['NO', '47'],
  ['NZ', '64'],
  ['PA', '507'],
  ['PL', '48'],
  ['PT', '351'],
  ['RO', '40'],
  ['RU', '7'],
  ['SE', '46'],
  ['SG', '65'],
  ['TR', '90'],
  ['UA', '380'],
  ['UY', '598'],
];

const ZONE_COUNTRY: Record<string, string> = {
  'Asia/Jerusalem': 'IL',
  'Asia/Tel_Aviv': 'IL',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Brussels': 'BE',
  'Europe/Amsterdam': 'NL',
  'Europe/Zurich': 'CH',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Vienna': 'AT',
  'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA',
  'Europe/Moscow': 'RU',
  'Africa/Johannesburg': 'ZA',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Buenos_Aires': 'AR',
  'America/Mexico_City': 'MX',
  'America/Panama': 'PA',
  'America/Montevideo': 'UY',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
};

/**
 * The visitor's likely country, from their device's time zone, falling back
 * to the page language. Client-only (reads Intl at runtime).
 */
export function guessCountry(locale: string): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (ZONE_COUNTRY[zone]) return ZONE_COUNTRY[zone];
    if (zone.startsWith('Australia/')) return 'AU';
    // Every other American zone this list doesn't name is most likely the US.
    if (zone.startsWith('America/') || zone.startsWith('US/') || zone === 'Pacific/Honolulu') return 'US';
  } catch {
    // Old browsers without Intl time zones fall through to the language.
  }
  return locale === 'he' ? 'IL' : 'US';
}

export function dialCodeOf(iso: string): string {
  return DIAL_CODES.find(([code]) => code === iso)?.[1] ?? '';
}

/**
 * One international number from the picker and what was typed: "+1 2125550100".
 * A number typed with its own "+" wins over the picker; a trunk "0" (as
 * Israelis write 050…) is dropped after a country code.
 */
export function composePhone(iso: string, typed: string): string {
  const raw = typed.trim();
  if (raw.startsWith('+')) return `+${raw.replace(/\D/g, '')}`;
  const national = raw.replace(/\D/g, '').replace(/^0+/, '');
  const code = dialCodeOf(iso);
  return code ? `+${code}${national}` : national;
}
