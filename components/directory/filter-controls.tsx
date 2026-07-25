import { cn } from "@/lib/utils";
import { capacityLabel } from "@/lib/directory/display";
import type { DirectoryCriteria } from "@/lib/directory/query-state";
import type { DirectoryFilters, PracticeCapacity } from "@/types/directory";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors duration-[var(--motion-micro)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        active
          ? "border-ribbon bg-ribbon-soft text-ribbon"
          : "border-line bg-card text-ink-2 hover:bg-neutral-100 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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
      <Group label="CPS panel level">
        {filters.grades.map((g) => (
          <Pill key={g.slug} active={criteria.levels.includes(g.rank)} onClick={() => toggleLevel(g.rank)}>
            {g.name}
          </Pill>
        ))}
      </Group>

      <Group label="Specialist panels">
        {filters.panels.map((p) => (
          <Pill key={p.slug} active={criteria.panels.includes(p.slug)} onClick={() => toggleStr("panels", p.slug)}>
            {p.name}
          </Pill>
        ))}
      </Group>

      {seniorityRoles.length > 0 && (
        <Group label="Seniority">
          {seniorityRoles.map((r) => (
            <Pill
              key={r.slug}
              active={criteria.seniority.includes(r.slug)}
              onClick={() => toggleStr("seniority", r.slug)}
            >
              {r.name}
            </Pill>
          ))}
        </Group>
      )}

      <Group label="Year of call">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="From"
            aria-label="Called from year"
            value={criteria.callFrom ?? ""}
            onChange={(e) => onChange({ callFrom: e.target.value ? Number(e.target.value) : null })}
            className="h-9 w-20 rounded-control border border-line bg-card px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <span className="text-sm text-ink-3">to</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="To"
            aria-label="Called to year"
            value={criteria.callTo ?? ""}
            onChange={(e) => onChange({ callTo: e.target.value ? Number(e.target.value) : null })}
            className="h-9 w-20 rounded-control border border-line bg-card px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
        </div>
      </Group>

      <Group label="Specialism">
        {filters.practiceAreas.map((a) => (
          <Pill
            key={a.slug}
            active={criteria.specialisms.includes(a.slug)}
            onClick={() => toggleStr("specialisms", a.slug)}
          >
            {a.name}
          </Pill>
        ))}
      </Group>

      <Group label="Practice capacity">
        {CAPACITIES.map((cap) => (
          <Pill
            key={cap}
            active={criteria.capacity === cap}
            onClick={() => onChange({ capacity: criteria.capacity === cap ? null : cap })}
          >
            {capacityLabel(cap)}
          </Pill>
        ))}
      </Group>
    </div>
  );
}
