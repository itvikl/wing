// Browser-side measurement: Meta Pixel events and campaign attribution.
// Every call is a no-op when the pixel isn't installed (no META_PIXEL_ID), so
// the site behaves the same with or without it.

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    dataLayer?: Record<string, unknown>[];
  }
}

/** A Meta standard event. `eventId` pairs it with the server's copy (Conversions API) so Meta counts it once. */
export function trackEvent(name: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined') return;
  try {
    window.fbq?.('track', name, params ?? {}, eventId ? { eventID: eventId } : undefined);
    // Ready for a future Google Tag Manager container: it reads this queue.
    window.dataLayer?.push({ event: name, ...params, eventId });
  } catch {
    // Measurement must never break the page.
  }
}

export function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** How the visitor first reached the site, sent with their lead. */
export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  landingUrl?: string;
  referrer?: string;
  firstSeen?: string;
};

const ATTRIBUTION_KEY = 'wings_attribution';
const ATTRIBUTION_DAYS = 30;
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;

/**
 * Remembers the campaign that brought the visitor (first touch, kept 30 days),
 * so a lead sent on a later visit, or after the URL lost its ?utm_ tail on
 * the way to /contact, still says which ad it came from.
 */
export function captureAttribution() {
  try {
    const url = new URL(window.location.href);
    const fromUrl: Attribution = {};
    for (const key of PARAMS) {
      const value = url.searchParams.get(key);
      if (value) fromUrl[key] = value.slice(0, 300);
    }
    const hasCampaign = Object.keys(fromUrl).length > 0;
    const stored = readStored();
    const fresh = !!stored && Date.now() - Date.parse(stored.firstSeen ?? '') < ATTRIBUTION_DAYS * 864e5;
    // A new campaign click replaces an older visit's record; a plain visit
    // (or the next page of this one) keeps it.
    if (!hasCampaign && fresh) return;
    const record: Attribution = {
      ...fromUrl,
      landingUrl: window.location.href.slice(0, 1000),
      referrer: document.referrer.slice(0, 1000) || undefined,
      firstSeen: new Date().toISOString(),
    };
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(record));
  } catch {
    // Private mode / blocked storage: the lead simply goes without it.
  }
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution {
  return readStored() ?? {};
}
