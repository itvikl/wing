'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads';

export function LeadForm() {
  const t = useTranslations('leadForm');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

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

  return (
    <section id="contact" className="bg-primary-dark py-16 text-neutral-100 sm:py-20 md:py-24">
      <div className="mx-auto max-w-xl px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-light">{t('eyebrow')}</span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-balance md:text-4xl">{t('title')}</h2>

        {status === 'success' ? (
          <p className="mt-10 text-lg text-accent-light">{t('success')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 grid gap-4 text-start">
            <input
              name="name"
              type="text"
              required
              placeholder={t('name')}
              className="rounded-lg border border-primary-soft bg-primary px-4 py-3 text-neutral-100 placeholder:text-neutral-200 focus:border-accent focus:outline-none"
            />
            <input
              name="phone"
              type="tel"
              required
              placeholder={t('phone')}
              className="rounded-lg border border-primary-soft bg-primary px-4 py-3 text-neutral-100 placeholder:text-neutral-200 focus:border-accent focus:outline-none"
            />
            <input
              name="email"
              type="email"
              required
              placeholder={t('email')}
              className="rounded-lg border border-primary-soft bg-primary px-4 py-3 text-neutral-100 placeholder:text-neutral-200 focus:border-accent focus:outline-none"
            />
            <textarea
              name="message"
              rows={3}
              placeholder={t('message')}
              className="rounded-lg border border-primary-soft bg-primary px-4 py-3 text-neutral-100 placeholder:text-neutral-200 focus:border-accent focus:outline-none"
            />
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
      </div>
    </section>
  );
}
