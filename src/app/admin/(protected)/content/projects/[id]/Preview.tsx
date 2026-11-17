'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { jumpToField, useAdminLocale } from '@/components/admin/AdminLocale';
import { ProjectPage, type ProjectPageLabels } from '@/components/project/ProjectPage';
import { projectView, type ProjectData } from '@/lib/projects/schema';
import type { ContentLocale } from '@/lib/content/schema';
import type { LeadPreviewLabels } from './Editor';

/** The width the page is laid out at before it's scaled down to the column. */
const DESKTOP_WIDTH = 1200;

/**
 * The real project page (the same component the site renders), laid out at
 * desktop width and scaled to fit the column, over the site's backdrop.
 * Clicking a part of it jumps to the field that part is edited in.
 */
export function ProjectPreview({
  data,
  labels,
  lead,
}: {
  data: ProjectData;
  labels: Record<ContentLocale, ProjectPageLabels>;
  lead: Record<ContentLocale, LeadPreviewLabels>;
}) {
  const { locale } = useAdminLocale();
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: DESKTOP_WIDTH, scale: 0.4, height: 0 });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const available = outer.clientWidth;
      // On a phone the page is laid out at the phone's own width (the site's
      // breakpoints follow the screen, not this box), so it isn't scaled.
      const width = window.innerWidth < 768 ? available : DESKTOP_WIDTH;
      const scale = Math.min(1, available / width);
      setFrame({ width, scale, height: inner.offsetHeight * scale });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Links inside the preview (back, contact) stay put.
    if (target.closest('a')) event.preventDefault();
    const part = target.closest<HTMLElement>('[data-jump]');
    if (part?.dataset.jump) jumpToField(part.dataset.jump, locale);
  }

  const view = projectView(data, locale);
  const pageLabels = labels[locale];
  const leadLabels = lead[locale];

  return (
    <div ref={outerRef} className="relative overflow-hidden" style={{ height: frame.height || undefined }}>
      <div
        ref={innerRef}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        lang={locale}
        onClick={handleClick}
        className="project-preview absolute left-0 top-0 isolate overflow-hidden bg-primary-dark"
        style={{ width: frame.width, transform: `scale(${frame.scale})`, transformOrigin: 'top left' }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <Image src="/scroll-world/img/main.webp" alt="" fill sizes="1200px" className="scale-105 object-cover object-top blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary-dark/85 to-primary-dark/95" />
        </div>
        <ProjectPage
          view={view}
          labels={pageLabels}
          locale={locale}
          projectsHref="#"
          contactHref="#"
          editable
          leadForm={
            <section className="flex justify-center px-4 py-8">
              <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-primary-dark/35 px-10 py-12 text-center text-white backdrop-blur-2xl">
                <span className="text-base uppercase tracking-[0.2em] text-accent-light">{pageLabels.leadEyebrow}</span>
                <h2 className="mt-4 font-display text-4xl font-semibold text-balance">{view.leadTitle}</h2>
                {view.leadText && <p className="mt-4 text-lg font-light text-neutral-200">{view.leadText}</p>}
                <div className="mt-10 grid gap-4 text-start">
                  {[leadLabels.name, leadLabels.phone, leadLabels.email].map((label) => (
                    <div key={label} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white/70">{label}</div>
                  ))}
                  <div className="mt-2 rounded-full bg-accent px-8 py-3 text-center font-medium text-primary-dark">{leadLabels.submit}</div>
                </div>
              </div>
            </section>
          }
        />
      </div>
    </div>
  );
}
