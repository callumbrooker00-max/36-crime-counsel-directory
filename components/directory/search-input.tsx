import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        role="searchbox"
        aria-label="Search counsel by name, specialism or case"
        placeholder="Search name, specialism, case…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-control border border-line bg-card pl-9 pr-3 text-md text-ink transition-colors placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      />
    </div>
  );
}
