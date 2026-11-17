'use client';

import { useState, useTransition } from 'react';
import type { ProjectData } from '@/lib/projects/schema';
import { drawMapAction, findAddressAction } from '../actions';

type Location = ProjectData['location'];

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none';
const ZOOMS: [number, string][] = [
  [14, 'השכונה והסביבה'],
  [15, 'השכונה'],
  [16, 'כמה רחובות'],
  [17, 'הרחוב'],
];
const NO_STREETS = { major: '', minor: '', parks: '' };

/** Coordinates written in a pasted Google Maps link or typed as "31.77, 35.21". */
function coordinatesIn(text: string): { lat: number; lng: number } | null {
  const patterns = [/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

/**
 * Where the building stands, for the neighbourhood map: type the address and
 * search, or paste a Google Maps link (its coordinates are read from it).
 * The streets around it are then drawn once and kept with the project, and
 * the preview beside the form shows the map.
 */
export function LocationField({ value, onChange }: { value: Location; onChange: (value: Location) => void }) {
  const [query, setQuery] = useState(value.address);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'wait'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const placed = value.lat !== null && value.lng !== null;
  const drawn = !!(value.streets.major || value.streets.minor);

  function draw(next: Location, found?: string) {
    if (next.lat === null || next.lng === null) return;
    const { lat, lng } = next;
    setMessage({ tone: 'wait', text: 'מצייר את רחובות השכונה… זה יכול לקחת עד דקה.' });
    startTransition(async () => {
      const result = await drawMapAction(lat, lng);
      if (!result.ok) {
        onChange({ ...next, streets: NO_STREETS });
        setMessage({ tone: 'error', text: result.error });
        return;
      }
      onChange({ ...next, streets: result.streets });
      setMessage({ tone: 'ok', text: `${found ? `נמצא: ${found}. ` : ''}המפה מוכנה. בדקו בתצוגה המקדימה שהסיכה במקום, ושמרו.` });
    });
  }

  function find() {
    setMessage(null);
    const direct = coordinatesIn(query);
    if (direct) return draw({ ...value, ...direct, address: '' });
    startTransition(async () => {
      const found = await findAddressAction(query);
      if (!found.ok) return setMessage({ tone: 'error', text: found.error });
      draw({ ...value, lat: found.lat, lng: found.lng, address: query.trim() }, found.label);
    });
  }

  return (
    <div className="grid gap-3" data-jump-target="location">
      <label htmlFor="project-address" className="text-sm font-medium text-primary-dark">
        מיקום הבניין: כתובת, או קישור מגוגל מפות
      </label>
      <div className="flex gap-2">
        <input
          id="project-address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              find();
            }
          }}
          placeholder="רמב״ן 12, ירושלים"
          className={INPUT}
        />
        <button
          type="button"
          onClick={find}
          disabled={pending || !query.trim()}
          className="shrink-0 rounded-full border border-neutral-200 px-4 text-sm text-primary-dark hover:border-accent disabled:opacity-50"
        >
          {pending ? 'רגע…' : 'מציאה על המפה'}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.tone === 'ok' ? 'text-green-700' : message.tone === 'error' ? 'text-red-600' : 'text-neutral-muted'}`}>{message.text}</p>
      )}

      {placed && (
        <div className="grid gap-3 rounded-xl bg-neutral-100 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-end">
            <label className="grid gap-1 text-xs text-neutral-muted">
              קו רוחב
              <input type="number" step="0.00001" dir="ltr" value={value.lat ?? ''} onChange={(e) => onChange({ ...value, lat: e.target.value === '' ? null : Number(e.target.value) })} className={INPUT} />
            </label>
            <label className="grid gap-1 text-xs text-neutral-muted">
              קו אורך
              <input type="number" step="0.00001" dir="ltr" value={value.lng ?? ''} onChange={(e) => onChange({ ...value, lng: e.target.value === '' ? null : Number(e.target.value) })} className={INPUT} />
            </label>
            <label className="grid gap-1 text-xs text-neutral-muted">
              כמה מהשכונה רואים
              <select value={value.zoom} onChange={(e) => onChange({ ...value, zoom: Number(e.target.value) })} className={INPUT}>
                {ZOOMS.map(([z, label]) => (
                  <option key={z} value={z}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={drawn ? 'text-green-700' : 'text-amber-700'}>{drawn ? 'המפה מצוירת.' : 'המפה עוד לא צוירה: בלי זה היא לא מוצגת.'}</span>
            <button type="button" onClick={() => draw(value)} disabled={pending} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-primary-dark hover:border-accent disabled:opacity-50">
              {drawn ? 'ציור מחדש (אחרי שינוי מיקום)' : 'ציור המפה'}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ ...value, lat: null, lng: null, streets: NO_STREETS });
                setMessage(null);
              }}
              className="rounded-full px-3 py-1 text-red-600 hover:bg-red-50"
            >
              הסרת המפה
            </button>
          </div>
        </div>
      )}
      {!placed && <p className="text-xs text-neutral-muted">בלי מיקום, החלק מוצג בלי מפה: רק הטקסט ומה יש בסביבה.</p>}
    </div>
  );
}
