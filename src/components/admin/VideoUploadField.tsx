'use client';

import { useRef, useState } from 'react';
import { requestMediaUpload } from '@/app/admin/(protected)/upload-actions';

export function VideoUploadField({
  label,
  folder,
  value,
  onChange,
}: {
  label: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progressNote, setProgressNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setProgressNote(`מעלה ${(file.size / (1024 * 1024)).toFixed(1)}MB…`);
    try {
      const { uploadUrl, publicUrl } = await requestMediaUpload(folder, file.name, file.type);
      const putResponse = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!putResponse.ok) throw new Error('ההעלאה נכשלה');
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההעלאה נכשלה');
    } finally {
      setUploading(false);
      setProgressNote(null);
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-primary-dark">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={value} muted className="h-20 w-32 shrink-0 rounded-lg border border-neutral-200 object-cover" />
        ) : (
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-center text-xs text-neutral-muted">
            אין סרטון
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-primary-dark transition-colors hover:bg-neutral-100 disabled:opacity-60"
          >
            {uploading ? 'מעלה…' : 'העלאת סרטון'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-neutral-muted hover:text-red-600"
            >
              הסרה
            </button>
          )}
        </div>
      </div>
      {progressNote && <p className="mt-1 text-xs text-neutral-muted">{progressNote}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
