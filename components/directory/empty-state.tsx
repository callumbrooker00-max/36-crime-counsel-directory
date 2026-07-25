import { Button } from "@/components/ui/button";

/** Zero-result state — directive, names the reason, never a dead end. The
 *  "Contact clerks" action lands in slice 5 with the enquiry sheet. */
export function EmptyState({ reason, onClearAll }: { reason: string; onClearAll: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-card border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-lg font-medium text-ink">No counsel match these filters</p>
      <p className="max-w-sm text-md text-ink-2">{reason} Try widening your filters, or contact the clerks.</p>
      <Button variant="primary" onClick={onClearAll}>
        Clear filters
      </Button>
    </div>
  );
}
