import type { DirectorySort } from "@/lib/directory/query-state";

export function SortControl({
  value,
  onChange,
}: {
  value: DirectorySort;
  onChange: (value: DirectorySort) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-3">
      <span className="hidden sm:inline">Sort</span>
      <select
        aria-label="Sort counsel"
        value={value}
        onChange={(e) => onChange(e.target.value as DirectorySort)}
        className="h-9 rounded-control border border-line bg-card px-2 text-sm text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <option value="call-year">Most senior</option>
        <option value="name">Name A–Z</option>
      </select>
    </label>
  );
}
