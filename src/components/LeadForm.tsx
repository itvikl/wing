'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads';
import { Sized, sizeStyle } from '@/lib/textSize';
import { DIAL_CODES, composePhone, guessCountry } from '@/lib/dialCodes';
import { getAttribution, newEventId, trackEvent } from '@/lib/tracking';
import { localePath, whatsappHref } from '@/lib/contact';
import type { TextSizes } from '@/lib/content/schema';
import { WhatsAppGlyph } from './icons';

// The flight clip's own last frame (main.mp4 at 14.96s). Re-extract it if the
// clip is ever re-rendered, or the hand-off below stops lining up.
const END_FRAME = '/scroll-world/img/end.webp';

const FIELD =
  'w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/70 backdrop-blur-md transition-colors focus:border-accent-light focus:bg-white/15 focus:outline-none';
// Native option lists take the page's colors on Windows/Android: keep them legible.
const SELECT = `${FIELD} cursor-pointer appearance-none pe-10 [&>option]:bg-primary-dark [&>option]:text-white`;

/** "America/New_York" → "New York". */
function zoneCity(zone: string) {
  return zone.split('/').pop()?.replace(/_/g, ' ') ?? zone;
}

/**
 * `overlay` is the home page's version: the form floats as a glass card over
 * the flythrough's final frame. That frame is pinned to the viewport with the
 * engine's exact framing (object-position per breakpoint, see scrollWorld.js's
 * .sw-scene__video), so when the stage dissolves at the portal hand-off the
 * picture underneath is the same one, pixel for pixel, and only the card
 * appears. `clip-path` keeps the fixed layer inside this section once the
 * page scrolls on to the footer (background-attachment:fixed doesn't work on
 * iOS).
 *
 * Built for buyers abroad: a dial-code picker (guessed from the device's time
 * zone), the hour that suits them for a call with their own time zone sent
 * along, three optional qualifying questions, and a marketing opt-in kept
 * separate from sending. A sent lead fires the Meta Pixel's Lead event with
 * the same id the server reports to Meta, so the two count once.
 */
export function LeadForm({
  variant = 'section',
  sizes,
}: {
  variant?: 'section' | 'overlay';
  /** The lead form's per-field text sizes (see textSizesSchema). */
  sizes?: TextSizes;
}) {
  const t = useTranslations('leadForm');
  const footer = useTranslations('footer');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  // Server render and first paint use the language's country; the device's
  // time zone refines it after hydration, unless the visitor already chose.
  const [country, setCountry] = useState(locale === 'he' ? 'IL' : 'US');
  const [countryChosen, setCountryChosen] = useState(false);
  const [timezone, setTimezone] = useState('');
  const overlay = variant === 'overlay';
  const whatsapp = whatsappHref(footer('whatsappLink'), footer('whatsappMessage'));

  useEffect(() => {
    if (!countryChosen) setCountry(guessCountry(locale));
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '');
    } catch {
      // No time zone support: the lead goes without it.
    }
    // Only on mount / language change — a later pick must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const options = (key: string) => ((t.raw(key) as string[] | undefined) ?? []).filter((o) => o.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? '').trim();

    const phoneInput = form.elements.namedItem('phone') as HTMLInputElement;
    const phone = composePhone(country, text('phone'));
    if (!/^\+?\d{7,15}$/.test(phone)) {
      phoneInput.setCustomValidity(locale === 'he' ? 'נא להזין מספר טלפון תקין' : 'Please enter a valid phone number');
      phoneInput.reportValidity();
      return;
    }

    setStatus('submitting');
    const eventId = newEventId();
    const purpose = text('purpose');

    try {
      await submitLead({
        name: text('name'),
        phone,
        country,
        email: text('email'),
        message: text('message'),
        budget: text('budget'),
        timeline: text('timeline'),
        purpose,
        callTime: text('callTime'),
        timezone,
        marketingConsent: data.get('marketingConsent') === 'on',
        locale,
        refUrl: window.location.href,
        eventId,
        attribution: getAttribution(),
      });
      trackEvent('Lead', { content_name: 'Lead form', lead_purpose: purpose || undefined }, eventId);
      form.reset();
      setStatus('success');
    } catch (error) {
      console.error('Lead submission failed', error);
      setStatus('error');
    }
  }

  const card =
    'w-full max-w-xl rounded-3xl border border-white/20 bg-primary-dark/35 px-6 py-10 text-center shadow-[0_30px_80px_-20px_rgba(5,32,26,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:px-10 sm:py-12';

  const content = (
    <>
      <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg"><Sized scale={sizes?.eyebrow}>{t('eyebrow')}</Sized></span>
      <h2 className="mt-4 font-display text-3xl font-semibold text-balance md:text-4xl"><Sized scale={sizes?.title}>{t('title')}</Sized></h2>

      {status === 'success' ? (
        <div role="status" className="mt-10">
          <p className="text-xl text-accent-light"><Sized scale={sizes?.success}>{t('success')}</Sized></p>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-base font-semibold text-[#05201A] transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppGlyph className="h-5 w-5" />
              <Sized scale={sizes?.successWhatsapp}>{t('successWhatsapp')}</Sized>
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid gap-4 text-start">
          <input name="name" type="text" autoComplete="name" required maxLength={200} placeholder={t('name')} aria-label={t('name')} className={FIELD} style={sizeStyle(sizes?.name)} />

          {/* Dial code first in both languages: a phone number reads left to right. */}
          <div className="flex gap-2" dir="ltr">
            <div className="relative shrink-0">
              <select
                aria-label={t('country')}
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCountryChosen(true);
                }}
                className={`${SELECT} w-[7.5rem] tabular-nums`}
                style={sizeStyle(sizes?.phone)}
              >
                {DIAL_CODES.map(([iso, code]) => (
                  <option key={iso} value={iso}>
                    {iso} +{code}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              maxLength={30}
              placeholder={t('phone')}
              aria-label={t('phone')}
              dir={locale === 'he' ? 'rtl' : 'ltr'}
              onInput={(e) => e.currentTarget.setCustomValidity('')}
              className={`${FIELD} min-w-0 flex-1`}
              style={sizeStyle(sizes?.phone)}
            />
          </div>

          <input name="email" type="email" autoComplete="email" required maxLength={200} placeholder={t('email')} aria-label={t('email')} className={FIELD} style={sizeStyle(sizes?.email)} />

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Choice name="budget" label={t('budget')} options={options('budgetOptions')} style={sizeStyle(sizes?.budget)} />
            <Choice name="timeline" label={t('timeline')} options={options('timelineOptions')} style={sizeStyle(sizes?.timeline)} />
            <Choice name="purpose" label={t('purpose')} options={options('purposeOptions')} style={sizeStyle(sizes?.purpose)} />
            <div>
              <Choice name="callTime" label={t('callTime')} options={options('callTimeOptions')} style={sizeStyle(sizes?.callTime)} />
              {timezone && (
                <p className="mt-1.5 px-1 text-sm text-white/70">{t('timezoneNote', { tz: zoneCity(timezone) })}</p>
              )}
            </div>
          </div>

          <textarea name="message" rows={3} maxLength={4000} placeholder={t('message')} aria-label={t('message')} className={FIELD} style={sizeStyle(sizes?.message)} />

          <label className="flex cursor-pointer items-start gap-3 px-1 text-sm text-white/85" style={sizeStyle(sizes?.consent)}>
            <input type="checkbox" name="marketingConsent" className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#B58238]" />
            <span>{t('consent')}</span>
          </label>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 rounded-full bg-accent px-8 py-3 text-base font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            <Sized scale={sizes?.submit}>{status === 'submitting' ? '…' : t('submit')}</Sized>
          </button>

          <p className="text-center text-sm text-white/70" style={sizeStyle(sizes?.privacyNote)}>
            {t('privacyNote')}{' '}
            <a href={localePath(locale, '/privacy')} target="_blank" className="underline underline-offset-2 hover:text-accent-light">
              {t('privacyLink')}
            </a>
          </p>

          {status === 'error' ? <p role="alert" className="text-base text-red-400"><Sized scale={sizes?.error}>{t('error')}</Sized></p> : null}
        </form>
      )}
    </>
  );

  if (!overlay) {
    return (
      <section id="contact" className="flex justify-center px-4 py-16 text-white sm:px-6 sm:py-20 md:py-24">
        <div className={card}>{content}</div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="relative isolate flex min-h-[100svh] items-center justify-center px-4 py-16 text-white [clip-path:inset(0)] sm:px-6"
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- must match the engine's plain <img>/<video> framing exactly */}
        <img
          src={END_FRAME}
          alt=""
          loading="eager"
          className="h-full w-full object-cover [object-position:center_42%] max-[860px]:[object-position:center_46%] max-[860px]:portrait:[object-position:center_44%]"
        />
        {/* Soft pool of shade behind the card only, so the frame's edges stay
            as bright as the video's were. */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,rgba(5,32,26,0.45),transparent_75%)]" />
      </div>

      <div className={card}>{content}</div>
    </section>
  );
}

/** An optional question as a select, its label shown as the empty choice. Hidden when the admin left it no options. */
function Choice({ name, label, options, style }: { name: string; label: string; options: string[]; style?: CSSProperties }) {
  const [value, setValue] = useState('');
  if (!options.length) return null;
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={label}
        className={`${SELECT} ${value ? '' : 'text-white/70'}`}
        style={style}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Chevron />
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
