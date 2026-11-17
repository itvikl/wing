'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProjectView } from '@/lib/projects/schema';

export type UnitLabels = {
  sqm: string;
  floor: string;
  floors: string;
  left: string;
  soldOut: string;
  total: string;
  planNote: string;
  planCta: string;
  planSoon: string;
};

/** "85–92" keeps reading low to high inside a right-to-left line. */
const Ltr = ({ children }: { children: string }) => <bdi dir="ltr">{children}</bdi>;
const fill = (template: string, n: number) => template.replace('{n}', String(n));

/**
 * One row per apartment type (rooms, a garden flat, the penthouse): its mark,
 * size, outdoor space, floors, how many the building has and how many are
 * left. Picking a row shows that type's typical plan beside the list.
 */
export function UnitTypes({ units, labels, still = false }: { units: ProjectView['units']; labels: UnitLabels; still?: boolean }) {
  const [active, setActive] = useState(0);
  const hasPlans = units.some((u) => u.plan);
  const current = units[Math.min(active, units.length - 1)];

  return (
    <div className={`grid items-start gap-8 ${hasPlans ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12' : ''}`}>
      <ul className="border-t border-white/10">
        {units.map((u, i) => {
          const soldOut = u.left === 0;
          const on = hasPlans && i === active;
          return (
            <li key={u.index} className="border-b border-white/10">
              <button
                type="button"
                onClick={() => !still && setActive(i)}
                aria-pressed={hasPlans ? on : undefined}
                aria-controls={hasPlans ? 'unit-plan' : undefined}
                className={`grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-4 text-start transition-colors sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] ${
                  on ? 'bg-accent/15' : hasPlans ? 'hover:bg-white/[0.04]' : 'cursor-default'
                }`}
              >
                <span className={`row-span-2 text-center font-display text-4xl leading-none sm:row-span-1 sm:text-5xl ${soldOut ? 'text-accent/45' : 'text-accent'}`}>
                  {u.code || '·'}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-neutral-100 sm:text-xl">
                    {u.title}
                    {u.size && (
                      <span className="font-sans text-base font-light text-neutral-100">
                        {' · '}
                        <Ltr>{u.size}</Ltr> {labels.sqm}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[15px] font-light leading-relaxed text-neutral-200/80">
                    {[
                      u.outdoor,
                      u.floors && (
                        <span key="f">
                          {u.floors.includes('–') || u.floors.includes('-') ? labels.floors : labels.floor} <Ltr>{u.floors}</Ltr>
                        </span>
                      ),
                      u.total !== null && fill(labels.total, u.total),
                    ]
                      .filter(Boolean)
                      .map((part, j) => (
                        <span key={j}>
                          {j > 0 && ' · '}
                          {part}
                        </span>
                      ))}
                  </span>
                </span>
                {u.left !== null && (
                  <span
                    className={`justify-self-start whitespace-nowrap rounded-full border px-3 py-1 font-display text-sm sm:justify-self-auto ${
                      soldOut ? 'border-white/15 text-neutral-200/70' : 'border-accent-light/50 text-accent-light'
                    }`}
                  >
                    {soldOut ? labels.soldOut : fill(labels.left, u.left)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {hasPlans && current && (
        <figure id="unit-plan" aria-live="polite" className="order-first m-0 rounded-[22px] bg-neutral-bg p-5 text-primary-dark lg:sticky lg:top-24 lg:order-none">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-display text-2xl font-semibold">{current.title}</span>
            {current.size && (
              <span className="text-[15px]">
                <Ltr>{current.size}</Ltr> {labels.sqm}
              </span>
            )}
          </div>
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-white">
            {current.plan ? (
              <Image src={current.plan} alt={current.title} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-contain p-2" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-base text-primary-dark/60">{labels.planSoon}</span>
            )}
          </div>
          <figcaption className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[13px] text-primary-dark/70">
            <span>{labels.planNote}</span>
            {current.left !== 0 && (
              <a href="#contact" className="underline underline-offset-2 hover:text-accent-dark">
                {labels.planCta}
              </a>
            )}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
