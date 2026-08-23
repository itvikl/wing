'use client';

import type { ReactNode } from 'react';

type Props<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  /** Hides add/remove/reorder controls — items can only have their rendered fields edited in place. */
  locked?: boolean;
};

export function RepeatableList<T>({
  items,
  onChange,
  newItem,
  renderItem,
  addLabel = 'הוספת פריט',
  locked = false,
}: Props<T>) {
  function update(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-neutral-200 bg-white p-4">
          {!locked && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-muted">#{index + 1}</span>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-neutral-muted hover:text-primary-dark disabled:opacity-30"
                >
                  למעלה
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="text-neutral-muted hover:text-primary-dark disabled:opacity-30"
                >
                  למטה
                </button>
                <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-700">
                  מחיקה
                </button>
              </div>
            </div>
          )}
          {renderItem(item, (patch) => update(index, patch), index)}
        </div>
      ))}
      {!locked && (
        <button
          type="button"
          onClick={() => onChange([...items, newItem()])}
          className="w-fit rounded-full border border-dashed border-neutral-200 px-4 py-2 text-sm text-neutral-muted transition-colors hover:border-accent hover:text-accent-dark"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
