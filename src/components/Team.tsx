import { getTranslations } from 'next-intl/server';
import { Reveal } from './motion/Reveal';
import { TiltCard } from './motion/TiltCard';

type Member = { name: string; initials: string; role: string; bio: string };

export async function Team() {
  const t = await getTranslations('team');
  const members = t.raw('members') as Member[];

  return (
    <section id="team" className="bg-neutral-100 py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{t('eyebrow')}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary-dark text-balance md:text-4xl">
            {t('title')}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, index) => (
            <Reveal key={member.name} index={index}>
              <TiltCard>
                <div className="flex h-full flex-col items-center rounded-2xl bg-neutral-bg p-8 text-center shadow-sm">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-dark font-display text-lg font-semibold text-accent-light">
                    {member.initials}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-primary-dark">{member.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-accent-dark">{member.role}</p>
                  <p className="mt-4 text-sm text-neutral-muted">{member.bio}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
