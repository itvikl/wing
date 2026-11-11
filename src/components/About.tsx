import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText } from '@/lib/content/store';
import type { ContentLocale } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { Reveal } from './motion/Reveal';

export async function About() {
  const t = await getTranslations('about');
  const paragraphs = t.raw('body') as string[];
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = (await getLocaleText((await getLocale()) as ContentLocale)).about.sizes;

  return (
    <section id="about" className="py-16 sm:py-20 md:py-24">
      <Reveal className="mx-auto max-w-3xl px-6 text-center">
        <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg"><Sized scale={sizes?.eyebrow}>{t('eyebrow')}</Sized></span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-neutral-100 text-balance md:text-4xl">
          <Sized scale={sizes?.title}>{t('title')}</Sized>
        </h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mx-auto mt-6 max-w-2xl text-lg text-neutral-200 md:text-xl">
            <Sized scale={sizes?.body}>{paragraph}</Sized>
          </p>
        ))}
      </Reveal>
    </section>
  );
}
