import { capacityLabel } from "@/lib/directory/display";
import { activeFilterCount, type DirectoryCriteria } from "@/lib/directory/query-state";
import type { DirectoryFilters } from "@/types/directory";

interface Chip {
  key: string;
  label: string;
  remove: Partial<DirectoryCriteria>;
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ActiveFilterChips({
  filters,
  criteria,
  onChange,
  onClearAll,
}: {
  filters: DirectoryFilters;
  criteria: DirectoryCriteria;
  onChange: (patch: Partial<DirectoryCriteria>) => void;
  onClearAll: () => void;
}) {
  if (activeFilterCount(criteria) === 0) return null;

  const name = <T extends { slug: string; name: string }>(list: T[], slug: string) =>
    list.find((x) => x.slug === slug)?.name ?? slug;

  const chips: Chip[] = [
    ...criteria.levels.map((rank) => ({
      key: `level-${rank}`,
      label: filters.grades.find((g) => g.rank === rank)?.name ?? `Level ${rank}`,
      remove: { levels: criteria.levels.filter((r) => r !== rank) },
    })),
    ...criteria.panels.map((slug) => ({
      key: `panel-${slug}`,
      label: name(filters.panels, slug),
      remove: { panels: criteria.panels.filter((s) => s !== slug) },
    })),
    ...criteria.seniority.map((slug) => ({
      key: `sen-${slug}`,
      label: name(filters.roles, slug),
      remove: { seniority: criteria.seniority.filter((s) => s !== slug) },
    })),
    ...(criteria.callFrom != null || criteria.callTo != null
      ? [
          {
            key: "call",
            label: `Called ${criteria.callFrom ?? "…"}–${criteria.callTo ?? "…"}`,
            remove: { callFrom: null, callTo: null } as Partial<DirectoryCriteria>,
          },
        ]
      : []),
    ...criteria.specialisms.map((slug) => ({
      key: `spec-${slug}`,
      label: name(filters.practiceAreas, slug),
      remove: { specialisms: criteria.specialisms.filter((s) => s !== slug) },
    })),
    ...(criteria.capacity
      ? [
          {
            key: "capacity",
            label: capacityLabel(criteria.capacity),
            remove: { capacity: null } as Partial<DirectoryCriteria>,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-card py-0.5 pl-2.5 pr-1 text-sm text-ink-2"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onChange(chip.remove)}
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-full p-0.5 text-ink-3 hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <XIcon />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-control px-2 py-1 text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Clear all
      </button>
    </div>
  );
}
