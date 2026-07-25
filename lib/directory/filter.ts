import type { DirectoryCounsel } from "@/types/directory";
import type { DirectoryCriteria } from "./query-state";

function searchHaystack(c: DirectoryCounsel): string {
  return [
    c.fullName,
    ...c.practiceAreas.map((a) => a.name),
    ...c.notableCases.flatMap((n) => [n.title, n.summary, n.citation, n.court, n.roleInCase]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesCapacity(counselCapacity: string, filter: string): boolean {
  // Single-select, inclusive of "both": a counsel who does both prosecution and
  // defence appears under either. Selecting "both" narrows to both-only.
  if (filter === "both") return counselCapacity === "both";
  return counselCapacity === filter || counselCapacity === "both";
}

/** Pure, synchronous in-memory filter + sort — the reason the directory is instant. */
export function applyFilters(counsel: DirectoryCounsel[], c: DirectoryCriteria): DirectoryCounsel[] {
  const tokens = c.q.toLowerCase().split(/\s+/).filter(Boolean);
  const usePanelOrLevel = c.panels.length > 0 || c.levels.length > 0;

  const result = counsel.filter((person) => {
    // Search: every token must appear across name / specialism / notable-case text.
    if (tokens.length) {
      const hay = searchHaystack(person);
      if (!tokens.every((t) => hay.includes(t))) return false;
    }

    // Panel × level: one active membership must satisfy BOTH facets together
    // (the CPS "Level 4 on RASSO" mental model).
    if (usePanelOrLevel) {
      const ok = person.panels.some(
        (pm) =>
          (c.panels.length === 0 || c.panels.includes(pm.panelSlug)) &&
          (c.levels.length === 0 || (pm.gradeRank != null && c.levels.includes(pm.gradeRank))),
      );
      if (!ok) return false;
    }

    // Seniority (KC / Junior) — OR within.
    if (c.seniority.length && !person.roles.some((r) => c.seniority.includes(r.slug))) return false;

    // Year of call range (a null call year is excluded once a range is set).
    if (c.callFrom != null || c.callTo != null) {
      if (person.yearOfCall == null) return false;
      if (c.callFrom != null && person.yearOfCall < c.callFrom) return false;
      if (c.callTo != null && person.yearOfCall > c.callTo) return false;
    }

    // Specialism — OR within.
    if (c.specialisms.length && !person.practiceAreas.some((a) => c.specialisms.includes(a.slug))) return false;

    // Practice capacity (single-select, inclusive of "both").
    if (c.capacity && !matchesCapacity(person.practiceCapacity, c.capacity)) return false;

    return true;
  });

  result.sort((a, b) => {
    if (c.sort === "name") return a.fullName.localeCompare(b.fullName);
    // call-year: most senior (earliest call) first; nulls last.
    const ay = a.yearOfCall ?? Number.POSITIVE_INFINITY;
    const by = b.yearOfCall ?? Number.POSITIVE_INFINITY;
    return ay - by || a.fullName.localeCompare(b.fullName);
  });

  return result;
}
