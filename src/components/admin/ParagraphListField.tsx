import { FieldHeader } from './fields';

/**
 * `jump` targets the whole list; each paragraph is also `${jump}.${index}`.
 * One size control for all the paragraphs (`size`/`onSize`).
 */
export function ParagraphListField({
  label,
  values,
  onChange,
  jump,
  size,
  onSize,
  addLabel = '+ הוספת פסקה',
  rows = 2,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  jump?: string;
  size?: number;
  onSize?: (value: number) => void;
  /** The add button's text ("+ הוספת אפשרות" for a select's choices). */
  addLabel?: string;
  rows?: number;
}) {
  function update(index: number, value: string) {
    onChange(values.map((v, i) => (i === index ? value : v)));
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="rounded-lg" data-jump-target={jump}>
      <FieldHeader label={label} size={size} onSize={onSize} />
      <div className="mt-2 grid gap-3">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2 rounded-lg" data-jump-target={jump ? `${jump}.${index}` : undefined}>
            <textarea
              value={value}
              rows={rows}
              onChange={(event) => update(index, event.target.value)}
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none"
            />
            <div className="flex flex-col gap-1 text-xs">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-neutral-muted hover:text-primary-dark disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
                className="text-neutral-muted hover:text-primary-dark disabled:opacity-30"
              >
                ▼
              </button>
              <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="mt-3 w-fit rounded-full border border-dashed border-neutral-200 px-4 py-2 text-sm text-neutral-muted transition-colors hover:border-accent hover:text-accent-dark"
      >
        {addLabel}
      </button>
    </div>
  );
}
