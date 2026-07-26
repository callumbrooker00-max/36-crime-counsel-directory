import { cn } from "@/lib/utils";
import { capacityLabel } from "@/lib/directory/display";
import type { DirectoryCriteria } from "@/lib/directory/query-state";
import type { DirectoryFilters, PracticeCapacity } from "@/types/directory";

// Refined toggle for short, scannable sets (levels, seniority, capacity).
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-[var(--motion-micro)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        active
          ? "bg-ribbon-soft text-ribbon ring-1 ring-ribbon/25"
          : "bg-neutral-100 text-ink-2 hover:bg-neutral-200 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

// Elegant checklist row for long lists (panels, specialisms).
function CheckRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className="group/row flex w-full items-center gap-2.5 rounded-control px-2 py-1.5 text-left text-sm transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-[var(--motion-micro)]",
          active ? "border-ribbon bg-ribbon text-white" : "border-neutral-300 bg-card group-hover/row:border-neutral-400",
        )}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
            <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={active ? "text-ink" : "text-ink-2"}>{children}</span>
    </button>
  );
}

function Group({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-3", !first && "border-t border-line-2 pt-6")}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">{label}</p>
      {children}
    </div>
  );
}

const CAPACITIES: PracticeCapacity[] = ["prosecution", "defence", "both"];

export function FilterControls({
  filters,
  criteria,
  onChange,
}: {
  filters: DirectoryFilters;
  criteria: DirectoryCriteria;
  onChange: (patch: Partial<DirectoryCriteria>) => void;
}) {
  const toggleStr = (key: "panels" | "seniority" | "specialisms", value: string) => {
    const arr = criteria[key];
    onChange({ [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] });
  };
  const toggleLevel = (rank: number) => {
    const arr = criteria.levels;
    onChange({ levels: arr.includes(rank) ? arr.filter((v) => v !== rank) : [...arr, rank] });
  };

  const seniorityRoles = filters.roles.filter((r) => r.slug === "kc" || r.slug === "junior");

  return (
    <div className="flex flex-col gap-6">
      <Group label="CPS panel level" first>
        <div className="flex flex-wrap gap-2">
          {filters.grades.map((g) => (
            <Pill key={g.slug} active={criteria.levels.includes(g.rank)} onClick={() => toggleLevel(g.rank)}>
              {g.name}
            </Pill>
          ))}
        </div>
      </Group>

      <Group label="Specialist panels">
        <div className="-mx-2 flex flex-col gap-0.5">
          {filters.panels.map((p) => (
            <CheckRow key={p.slug} active={criteria.panels.includes(p.slug)} onClick={() => toggleStr("panels", p.slug)}>
              {p.name}
            </CheckRow>
          ))}
        </div>
      </Group>

      {seniorityRoles.length > 0 && (
        <Group label="Seniority">
          <div className="flex flex-wrap gap-2">
            {seniorityRoles.map((r) => (
              <Pill key={r.slug} active={criteria.seniority.includes(r.slug)} onClick={() => toggleStr("seniority", r.slug)}>
                {r.name}
              </Pill>
            ))}
          </div>
        </Group>
      )}

      <Group label="Year of call">
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            placeholder="From"
            aria-label="Called from year"
            value={criteria.callFrom ?? ""}
            onChange={(e) => onChange({ callFrom: e.target.value ? Number(e.target.value) : null })}
            className="h-9 w-24 rounded-control border border-transparent bg-neutral-100 px-3 text-sm text-ink transition-colors focus:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <span className="text-sm text-ink-3">to</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="To"
            aria-label="Called to year"
            value={criteria.callTo ?? ""}
            onChange={(e) => onChange({ callTo: e.target.value ? Number(e.target.value) : null })}
            className="h-9 w-24 rounded-control border border-transparent bg-neutral-100 px-3 text-sm text-ink transition-colors focus:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
        </div>
      </Group>

      <Group label="Specialism">
        <div className="-mx-2 flex flex-col gap-0.5">
          {filters.practiceAreas.map((a) => (
            <CheckRow key={a.slug} active={criteria.specialisms.includes(a.slug)} onClick={() => toggleStr("specialisms", a.slug)}>
              {a.name}
            </CheckRow>
          ))}
        </div>
      </Group>

      <Group label="Practice capacity">
        <div className="flex flex-wrap gap-2">
          {CAPACITIES.map((cap) => (
            <Pill
              key={cap}
              active={criteria.capacity === cap}
              onClick={() => onChange({ capacity: criteria.capacity === cap ? null : cap })}
            >
              {capacityLabel(cap)}
            </Pill>
          ))}
        </div>
      </Group>
    </div>
  );
}
