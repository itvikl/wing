'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { uploadMedia } from '@/components/admin/uploadMedia';

/**
 * The project's photos: add several at once, put them in order, remove one.
 * The first is the large one on the page.
 */
export function GalleryField({
  images,
  onChange,
  onAdd,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  /** New uploads, appended to whatever the list is by the time they finish. */
  onAdd: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    setUploading(files.length);
    const results = await Promise.allSettled(files.map((file) => uploadMedia('projects', file)));
    const urls = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (urls.length) onAdd(urls);
    const failures = results.flatMap((r) => (r.status === 'rejected' ? [r.reason] : []));
    if (failures.length) {
      const reason = failures[0] instanceof Error ? failures[0].message : '';
      setError(`${failures.length === 1 ? 'תמונה אחת לא עלתה.' : `${failures.length} תמונות לא עלו.`} ${reason}`);
    }
    setUploading(0);
  }

  function move(from: number, to: number) {
    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  }

  const small = 'flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-sm text-primary-dark shadow-sm hover:bg-white disabled:opacity-30';

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            <Image src={src} alt="" fill sizes="140px" className="object-cover" />
            <span className="absolute start-1.5 top-1.5 rounded bg-primary-dark/75 px-1.5 text-xs tabular-nums text-white">{i + 1}</span>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <span className="flex gap-1">
                <button type="button" aria-label={`תמונה ${i + 1} מוקדם יותר`} disabled={i === 0} onClick={() => move(i, i - 1)} className={small}>→</button>
                <button type="button" aria-label={`תמונה ${i + 1} מאוחר יותר`} disabled={i === images.length - 1} onClick={() => move(i, i + 1)} className={small}>←</button>
              </span>
              <button type="button" aria-label={`הסרת תמונה ${i + 1}`} onClick={() => onChange(images.filter((_, j) => j !== i))} className={`${small} text-red-600`}>×</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-200 text-sm text-neutral-muted transition-colors hover:border-accent hover:text-primary-dark disabled:opacity-60"
        >
          {uploading ? `מעלה ${uploading}…` : (<><span className="text-lg">+</span>הוספת תמונות</>)}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length) void handleFiles(files);
        }}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
