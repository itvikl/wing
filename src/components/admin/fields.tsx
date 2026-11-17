'use client';

import { useEffect, useId, useRef } from 'react';
import type { TextSizes } from '@/lib/content/schema';

// `jump` marks the field as the target a preview element jumps to (see
// AdminLocale's Jump): unique within the screen, the same in both languages.
// `size`/`onSize` add the per-field text size control (see textSizesSchema);
// spread sizeField() into a field to wire them.

const SIZE_STEP = 0.1;
const SIZE_MIN = 0.5;
const SIZE_MAX = 2.5;

/** Props for a field's size control, reading and writing one key of a sizes map. */
export function sizeField(sizes: TextSizes, key: string, set: (sizes: Record<string, number>) => void) {
  return {
    size: sizes?.[key] ?? 1,
    // A reset is written as 1 rather than deleting the key; see textSizesSchema.
    onSize: (value: number) => set({ ...(sizes ?? {}), [key]: value }),
  };
}

/** A− / percentage / A+. Clicking the percentage puts it back to 100%. */
export function SizeControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const step = (direction: 1 | -1) => {
    const next = Math.round((value + direction * SIZE_STEP) * 10) / 10;
    onChange(Math.min(SIZE_MAX, Math.max(SIZE_MIN, next)));
  };
  const changed = value !== 1;
  return (
    <span className="flex items-center gap-1 text-xs" dir="ltr">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= SIZE_MIN}
        aria-label="הקטנת הטקסט"
        className="h-6 w-7 rounded-md border border-neutral-200 bg-white text-[11px] text-primary-dark hover:border-accent disabled:opacity-30"
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        title={changed ? 'חזרה לגודל המקורי' : 'גודל הטקסט באתר'}
        className={`h-6 min-w-[3rem] rounded-md px-1 tabular-nums ${
          changed ? 'bg-accent/15 font-semibold text-accent-dark' : 'text-neutral-muted'
        }`}
      >
        {Math.round(value * 100)}%
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= SIZE_MAX}
        aria-label="הגדלת הטקסט"
        className="h-6 w-7 rounded-md border border-neutral-200 bg-white text-sm text-primary-dark hover:border-accent disabled:opacity-30"
      >
        A+
      </button>
    </span>
  );
}

/** The field's label, with the size control beside it when the field has one. */
export function FieldHeader({
  label,
  htmlFor,
  size,
  onSize,
}: {
  label: string;
  htmlFor?: string;
  size?: number;
  onSize?: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-primary-dark">
        {label}
      </label>
      {onSize && <SizeControl value={size ?? 1} onChange={onSize} />}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  jump,
  size,
  onSize,
  singleLine = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  jump?: string;
  size?: number;
  onSize?: (value: number) => void;
  /** For a link, phone, email or code: one line, Enter does nothing. */
  singleLine?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  // One line tall, growing with each line break the editor adds (Enter) and
  // with wrapping on a narrow screen: the site shows the text broken at
  // exactly the typed points (white-space:pre-line in globals.css), so a
  // heading's lines are the editor's to set.
  //
  // A field in the language not being edited is hidden (display:none), where
  // scrollHeight reads 0: measuring it then pinned it shut, and the text was
  // cut off once that language was shown. So a hidden field is left alone,
  // and a ResizeObserver measures again whenever the field's width changes,
  // which includes the moment it's first shown and a phone rotating.
  const fit = () => {
    const el = ref.current;
    if (!el || el.offsetParent === null) return;
    el.style.height = 'auto';
    // border-box sizing: scrollHeight leaves out the 1px borders.
    el.style.height = `${el.scrollHeight + 2}px`;
  };

  useEffect(fit, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let width = -1;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      // Our own height change re-triggers the observer; only a new width matters.
      if (next === width) return;
      width = next;
      fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const className = 'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none';

  return (
    <div className="grid gap-1.5 rounded-lg text-sm" data-jump-target={jump}>
      <FieldHeader label={label} htmlFor={id} size={size} onSize={onSize} />
      {singleLine ? (
        <input id={id} type="text" dir="auto" value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      ) : (
        <textarea
          ref={ref}
          id={id}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} min-h-[42px] resize-none overflow-hidden leading-6`}
        />
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  jump,
  size,
  onSize,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  jump?: string;
  size?: number;
  onSize?: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5 rounded-lg text-sm" data-jump-target={jump}>
      <FieldHeader label={label} htmlFor={id} size={size} onSize={onSize} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none"
      />
    </div>
  );
}
