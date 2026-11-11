import type { CSSProperties, ReactNode } from 'react';
import type { TextSizes } from '@/lib/content/schema';

/**
 * Scales a field's text by the admin's per-field size (see textSizesSchema),
 * relative to whatever size the element's own classes give it, so each
 * breakpoint's size keeps its proportion. An inline-block, not a plain span:
 * scaled down, an inline span keeps the parent's full line height, and a
 * multi-line heading would open up between its lines.
 */
export function Sized({ scale, children }: { scale?: number; children: ReactNode }) {
  if (!scale || scale === 1) return <>{children}</>;
  return <span style={{ display: 'inline-block', fontSize: `${scale}em` }}>{children}</span>;
}

/** The same scale as a style, for an element with no children to wrap (a placeholder). */
export function sizeStyle(scale?: number): CSSProperties | undefined {
  return scale && scale !== 1 ? { fontSize: `${scale}em` } : undefined;
}

/** A size from a sizes map, or undefined when the field was never sized. */
export function sizeOf(sizes: TextSizes, key: string): number | undefined {
  return sizes?.[key];
}
