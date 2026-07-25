"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { applyFilters } from "@/lib/directory/filter";
import {
  parseCriteria,
  toQueryString,
  activeFilterCount,
  type DirectoryCriteria,
} from "@/lib/directory/query-state";
import type { DirectoryFilters, DirectoryPayload } from "@/types/directory";
import { SearchInput } from "./search-input";
import { SortControl } from "./sort-control";
import { ResultCount } from "./result-count";
import { FilterControls } from "./filter-controls";
import { FilterSheet } from "./filter-sheet";
import { ActiveFilterChips } from "./active-filter-chips";
import { CardGrid } from "./card-grid";
import { EmptyState } from "./empty-state";
import { EnquirySheet } from "@/components/profile/enquiry-sheet";

function describeReason(criteria: DirectoryCriteria, filters: DirectoryFilters): string {
  const levels = criteria.levels
    .map((r) => filters.grades.find((g) => g.rank === r)?.name)
    .filter(Boolean) as string[];
  const panels = criteria.panels
    .map((s) => filters.panels.find((p) => p.slug === s)?.name)
    .filter(Boolean) as string[];
  if (levels.length && panels.length) {
    return `No ${levels.join(" or ")} counsel are on the ${panels.join(" or ")} panel.`;
  }
  if (criteria.q.trim()) return `Nothing matches “${criteria.q.trim()}” with these filters.`;
  return "No counsel match the current filters.";
}

export function DirectoryClient({ payload }: { payload: DirectoryPayload }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const criteria = React.useMemo(() => parseCriteria(searchParams), [searchParams]);

  // Search echoes instantly (local) while the URL write is debounced for sharing.
  // Re-sync from the URL (share link, back/forward, clear all) via the
  // adjust-state-during-render pattern rather than an effect.
  const [q, setQ] = React.useState(criteria.q);
  const [urlQ, setUrlQ] = React.useState(criteria.q);
  if (criteria.q !== urlQ) {
    setUrlQ(criteria.q);
    setQ(criteria.q);
  }
  const debounce = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const commit = React.useCallback(
    (next: DirectoryCriteria) => router.replace(`${pathname}${toQueryString(next)}`, { scroll: false }),
    [router, pathname],
  );
  const update = React.useCallback(
    (patch: Partial<DirectoryCriteria>) => commit({ ...criteria, q, ...patch }),
    [commit, criteria, q],
  );
  const onSearch = (value: string) => {
    setQ(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => commit({ ...criteria, q: value }), 200);
  };
  const clearAll = () => {
    setQ("");
    router.replace(pathname, { scroll: false });
  };

  const liveCriteria = React.useMemo<DirectoryCriteria>(() => ({ ...criteria, q }), [criteria, q]);
  const results = React.useMemo(
    () => applyFilters(payload.counsel, liveCriteria),
    [payload.counsel, liveCriteria],
  );

  const [enquiryOpen, setEnquiryOpen] = React.useState(false);
  const caseTypes = React.useMemo(
    () => payload.filters.practiceAreas.map((a) => ({ value: a.name, label: a.name })),
    [payload.filters.practiceAreas],
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link href="/" className="shrink-0 font-serif text-md font-semibold tracking-tight text-ink">
          36 · Crime
        </Link>
        <SearchInput value={q} onChange={onSearch} className="max-w-md flex-1" />
        <div className="ml-auto flex items-center gap-3">
          <ResultCount count={results.length} />
          <div className="hidden sm:block">
            <SortControl value={criteria.sort} onChange={(sort) => update({ sort })} />
          </div>
          <FilterSheet
            filters={payload.filters}
            criteria={criteria}
            onChange={update}
            resultCount={results.length}
            activeCount={activeFilterCount(criteria)}
          />
        </div>
      </header>

      <div className="flex gap-8 py-6">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <div className="sticky top-[68px]">
            <FilterControls filters={payload.filters} criteria={criteria} onChange={update} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {activeFilterCount(criteria) > 0 && (
            <div className="mb-4">
              <ActiveFilterChips
                filters={payload.filters}
                criteria={criteria}
                onChange={update}
                onClearAll={clearAll}
              />
            </div>
          )}
          {results.length > 0 ? (
            <CardGrid counsel={results} />
          ) : (
            <EmptyState
              reason={describeReason(liveCriteria, payload.filters)}
              onClearAll={clearAll}
              onContactClerks={() => setEnquiryOpen(true)}
            />
          )}
        </div>
      </div>

      <EnquirySheet open={enquiryOpen} onOpenChange={setEnquiryOpen} caseTypes={caseTypes} />
    </div>
  );
}
