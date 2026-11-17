'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads';
import { composePhone, guessCountry } from '@/lib/dialCodes';
import { getAttribution, newEventId, trackEvent } from '@/lib/tracking';
import { localePath } from '@/lib/contact';

const FIELD =
  'w-full rounded-none border-0 border-b border-neutral-100/35 bg-transparent px-0 py-2 text-base text-neutral-100 placeholder:text-neutral-100/0 focus:border-accent-light focus:outline-none';

/**
 * Name, phone, email and an arrow, on the edge of a project's opening photo:
 * for whoever is convinced by the first screen. A local phone number gets the
 * dial code of the visitor's country (from their time zone), or they type it
 * with +. Sends the same lead as the full form, marked with the project.
 */
export function QuickLeadForm({ title, text, sentText, project }: { title: string; text: string; sentText: string; project: string }) {
  const t = useTranslations('leadForm');
  const locale = useLocale();
  const [country, setCountry] = useState(locale === 'he' ? 'IL' : 'US');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => setCountry(guessCountry(locale)), [locale]);

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
    setStatus('sending');
    const eventId = newEventId();
    try {
      await submitLead({
        name: text('name'),
        phone,
        country,
        email: text('email'),
        locale,
        refUrl: window.location.href,
        project,
        eventId,
        attribution: getAttribution(),
      });
      trackEvent('Lead', { content_name: `Project: ${project}` }, eventId);
      setStatus('sent');
    } catch (error) {
      console.error('Quick lead failed', error);
      setStatus('error');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-end gap-x-6 gap-y-4 rounded-[22px] border border-white/10 bg-primary/85 px-7 py-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))_auto]"
    >
      <div className="pb-1">
        <p className="font-display text-2xl font-semibold text-neutral-100">{title}</p>
        {text && <p className="mt-1 text-sm font-light text-neutral-200/80">{text}</p>}
      </div>

      {status === 'sent' ? (
        <p role="status" className="pb-2 text-lg text-accent-light lg:col-span-4">
          {sentText}
        </p>
      ) : (
        <>
          <label className="grid gap-1 text-sm text-neutral-200/80">
            {t('name')}
            <input name="name" required maxLength={200} autoComplete="name" className={FIELD} />
          </label>
          <label className="grid gap-1 text-sm text-neutral-200/80">
            {t('phone')}
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              required
              maxLength={30}
              autoComplete="tel"
              dir="ltr"
              onInput={(e) => e.currentTarget.setCustomValidity('')}
              className={`${FIELD} rtl:text-right`}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-200/80">
            {t('email')}
            <input name="email" type="email" maxLength={200} autoComplete="email" dir="ltr" className={`${FIELD} rtl:text-right`} />
          </label>
          <button
            type="submit"
            disabled={status === 'sending'}
            aria-label={t('submit')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary-dark transition-[background-color,transform] hover:bg-accent-light hover:-translate-x-0.5 disabled:opacity-60 ltr:hover:translate-x-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 ltr:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
        </>
      )}

      {status !== 'sent' && (
        <p className="text-xs text-neutral-200/60 lg:col-span-5">
          {t('privacyNote')}{' '}
          <a href={localePath(locale, '/privacy')} target="_blank" className="underline underline-offset-2 hover:text-accent-light">
            {t('privacyLink')}
          </a>
          {status === 'error' && <span role="alert" className="ms-3 text-red-300">{t('error')}</span>}
        </p>
      )}
    </form>
  );
}
