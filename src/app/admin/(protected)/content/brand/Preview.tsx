export function BrandPreview({ logo }: { logo: string }) {
  return (
    <div className="flex items-center justify-between bg-primary p-4 text-neutral-100">
      <div className="flex items-center gap-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-8 w-auto" />
        ) : (
          <span className="text-xs text-neutral-200">אין לוגו</span>
        )}
      </div>
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary-dark">בקשו גישה</span>
    </div>
  );
}
