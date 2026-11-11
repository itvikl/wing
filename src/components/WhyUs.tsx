import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText } from '@/lib/content/store';
import type { ContentLocale } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { Reveal } from './motion/Reveal';

type Item = { title: string; body: string; sizes?: Record<string, number> };

export async function WhyUs() {
  const t = await getTranslations('whyUs');
  const items = t.raw('items') as Item[];
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = (await getLocaleText((await getLocale()) as ContentLocale)).whyUs.sizes;

  return (
    <section id="why-us" className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg"><Sized scale={sizes?.eyebrow}>{t('eyebrow')}</Sized></span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-neutral-100 text-balance md:text-4xl">
            <Sized scale={sizes?.title}>{t('title')}</Sized>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 text-start sm:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.title} index={index}>
              <div className="h-full rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md transition-transform hover:-translate-y-1">
                <h3 className="font-display text-xl font-semibold text-neutral-100"><Sized scale={item.sizes?.title}>{item.title}</Sized></h3>
                <p className="mt-2 text-lg text-neutral-200"><Sized scale={item.sizes?.body}>{item.body}</Sized></p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
