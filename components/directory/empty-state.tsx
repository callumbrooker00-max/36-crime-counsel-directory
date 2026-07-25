import { Button } from "@/components/ui/button";

/** Zero-result state — directive, names the reason, never a dead end. */
export function EmptyState({
  reason,
  onClearAll,
  onContactClerks,
}: {
  reason: string;
  onClearAll: () => void;
  onContactClerks: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-card border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-lg font-medium text-ink">No counsel match these filters</p>
      <p className="max-w-sm text-md text-ink-2">{reason} Try widening your filters, or contact the clerks.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={onClearAll}>
          Clear filters
        </Button>
        <Button variant="secondary" onClick={onContactClerks}>
          Contact clerks
        </Button>
      </div>
    </div>
  );
}
