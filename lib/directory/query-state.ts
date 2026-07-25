import type { PracticeCapacity } from "@/types/directory";

export type DirectorySort = "call-year" | "name";

/** All directory view state — the single source of truth lives in the URL. */
export interface DirectoryCriteria {
  q: string;
  levels: number[]; // grade ranks
  panels: string[]; // panel slugs
  seniority: string[]; // role slugs (kc | junior)
  callFrom: number | null;
  callTo: number | null;
  specialisms: string[]; // practice-area slugs
  capacity: PracticeCapacity | null; // single-select
  sort: DirectorySort;
}

export const EMPTY_CRITERIA: DirectoryCriteria = {
  q: "",
  levels: [],
  panels: [],
  seniority: [],
  callFrom: null,
  callTo: null,
  specialisms: [],
  capacity: null,
  sort: "call-year",
};

type Params = { get(key: string): string | null };

const list = (v: string | null): string[] => (v ? v.split(",").filter(Boolean) : []);
const ints = (v: string | null): number[] => list(v).map(Number).filter((n) => !Number.isNaN(n));
const int = (v: string | null): number | null => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export function parseCriteria(params: Params): DirectoryCriteria {
  const capacity = params.get("capacity");
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? "",
    levels: ints(params.get("level")),
    panels: list(params.get("panel")),
    seniority: list(params.get("seniority")),
    callFrom: int(params.get("callFrom")),
    callTo: int(params.get("callTo")),
    specialisms: list(params.get("specialism")),
    capacity: capacity === "prosecution" || capacity === "defence" || capacity === "both" ? capacity : null,
    sort: sort === "name" ? "name" : "call-year",
  };
}

/** Serialize to a query string, omitting defaults so shared URLs stay clean. */
export function toQueryString(c: DirectoryCriteria): string {
  const p = new URLSearchParams();
  if (c.q.trim()) p.set("q", c.q.trim());
  if (c.levels.length) p.set("level", [...c.levels].sort((a, b) => b - a).join(","));
  if (c.panels.length) p.set("panel", c.panels.join(","));
  if (c.seniority.length) p.set("seniority", c.seniority.join(","));
  if (c.callFrom != null) p.set("callFrom", String(c.callFrom));
  if (c.callTo != null) p.set("callTo", String(c.callTo));
  if (c.specialisms.length) p.set("specialism", c.specialisms.join(","));
  if (c.capacity) p.set("capacity", c.capacity);
  if (c.sort !== "call-year") p.set("sort", c.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Count of active filter values (excludes free-text search and sort). */
export function activeFilterCount(c: DirectoryCriteria): number {
  return (
    c.levels.length +
    c.panels.length +
    c.seniority.length +
    c.specialisms.length +
    (c.capacity ? 1 : 0) +
    (c.callFrom != null || c.callTo != null ? 1 : 0)
  );
}

export function hasAnyFilter(c: DirectoryCriteria): boolean {
  return activeFilterCount(c) > 0 || c.q.trim().length > 0;
}
