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
    <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
      <header className="sticky top-0 z-20 -mx-5 border-b border-line/80 bg-paper/75 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex items-center gap-4 py-4">
          <Link href="/" className="shrink-0 font-serif text-lg font-semibold tracking-tight text-ink">
            36 <span className="text-ink-3">·</span> Crime
          </Link>
          <SearchInput value={q} onChange={onSearch} className="mx-auto w-full max-w-xl flex-1" />
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
        </div>
      </header>

      <div className="flex gap-10 py-8 lg:gap-16 lg:py-12">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-[88px]">
            <FilterControls filters={payload.filters} criteria={criteria} onChange={update} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {activeFilterCount(criteria) > 0 && (
            <div className="mb-6">
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
