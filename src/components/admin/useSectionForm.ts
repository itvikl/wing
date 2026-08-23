'use client';

import { useState, type FormEvent } from 'react';

export function useSectionForm<T>(initial: T, action: (data: T) => Promise<void>) {
  const [data, setData] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await action(data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השמירה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return { data, setData, saving, saved, error, handleSubmit };
}
