import { getTranslations } from 'next-intl/server';
import { Reveal } from './motion/Reveal';

type Item = { title: string; body: string };

export async function WhyUs() {
  const t = await getTranslations('whyUs');
  const items = t.raw('items') as Item[];

  return (
    <section id="why-us" className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg">{t('eyebrow')}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-neutral-100 text-balance md:text-4xl">
            {t('title')}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 text-start sm:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.title} index={index}>
              <div className="h-full rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md transition-transform hover:-translate-y-1">
                <h3 className="font-display text-xl font-semibold text-neutral-100">{item.title}</h3>
                <p className="mt-2 text-lg text-neutral-200">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
