import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FilterControls } from "./filter-controls";
import type { DirectoryCriteria } from "@/lib/directory/query-state";
import type { DirectoryFilters } from "@/types/directory";

/** Mobile filters: same set as the desktop rail, in a bottom sheet, applied
 *  live against the running count (components.md §2.2). */
export function FilterSheet({
  filters,
  criteria,
  onChange,
  resultCount,
  activeCount,
}: {
  filters: DirectoryFilters;
  criteria: DirectoryCriteria;
  onChange: (patch: Partial<DirectoryCriteria>) => void;
  resultCount: number;
  activeCount: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-card px-3 text-sm text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:hidden"
        >
          Filters
          {activeCount > 0 && <span className="font-medium text-ribbon">· {activeCount}</span>}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" title="Filters">
        <div className="flex-1 overflow-y-auto pb-2">
          <FilterControls filters={filters} criteria={criteria} onChange={onChange} />
        </div>
        <SheetClose asChild>
          <Button variant="primary" className="w-full">
            Show {resultCount} counsel
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
