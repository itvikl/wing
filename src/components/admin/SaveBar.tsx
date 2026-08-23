export function SaveBar({ saving, saved, error }: { saving: boolean; saved: boolean; error: string | null }) {
  return (
    <div className="sticky bottom-0 mt-8 flex items-center gap-4 border-t border-neutral-200 bg-neutral-100/95 py-4 backdrop-blur">
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent px-8 py-3 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        {saving ? 'שומר…' : 'שמירה'}
      </button>
      {saved && <span className="text-sm text-green-700">נשמר בהצלחה ✓</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
