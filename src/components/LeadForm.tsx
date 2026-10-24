'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads';

// The flight clip's own last frame (main.mp4 at 14.96s). Re-extract it if the
// clip is ever re-rendered, or the hand-off below stops lining up.
const END_FRAME = '/scroll-world/img/end.webp';

/**
 * `overlay` is the home page's version: the form floats as a glass card over
 * the flythrough's final frame. That frame is pinned to the viewport with the
 * engine's exact framing (object-position per breakpoint, see scrollWorld.js's
 * .sw-scene__video), so when the stage dissolves at the portal hand-off the
 * picture underneath is the same one, pixel for pixel, and only the card
 * appears. `clip-path` keeps the fixed layer inside this section once the
 * page scrolls on to the footer (background-attachment:fixed doesn't work on
 * iOS).
 */
export function LeadForm({ variant = 'section' }: { variant?: 'section' | 'overlay' }) {
  const t = useTranslations('leadForm');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const overlay = variant === 'overlay';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('submitting');

    try {
      await submitLead({
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
        refUrl: window.location.href,
      });
      form.reset();
      setStatus('success');
    } catch (error) {
      console.error('Lead submission failed', error);
      setStatus('error');
    }
  }

  const field = overlay
    ? 'rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/70 backdrop-blur-md transition-colors focus:border-accent-light focus:bg-white/15 focus:outline-none'
    : 'rounded-lg border border-primary-soft bg-primary px-4 py-3 text-neutral-100 placeholder:text-neutral-200 focus:border-accent focus:outline-none';

  const content = (
    <>
      <span className="text-xs uppercase tracking-[0.2em] text-accent-light">{t('eyebrow')}</span>
      <h2 className="mt-4 font-display text-3xl font-semibold text-balance md:text-4xl">{t('title')}</h2>

      {status === 'success' ? (
        <p className="mt-10 text-lg text-accent-light">{t('success')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid gap-4 text-start">
          <input name="name" type="text" required placeholder={t('name')} className={field} />
          <input name="phone" type="tel" required placeholder={t('phone')} className={field} />
          <input name="email" type="email" required placeholder={t('email')} className={field} />
          <textarea name="message" rows={3} placeholder={t('message')} className={field} />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 rounded-full bg-accent px-8 py-3 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {status === 'submitting' ? '…' : t('submit')}
          </button>
          {status === 'error' ? <p className="text-sm text-red-400">{t('error')}</p> : null}
        </form>
      )}
    </>
  );

  if (!overlay) {
    return (
      <section id="contact" className="bg-primary-dark py-16 text-neutral-100 sm:py-20 md:py-24">
        <div className="mx-auto max-w-xl px-6 text-center">{content}</div>
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

      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-primary-dark/35 px-6 py-10 text-center shadow-[0_30px_80px_-20px_rgba(5,32,26,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:px-10 sm:py-12">
        {content}
      </div>
    </section>
  );
}
