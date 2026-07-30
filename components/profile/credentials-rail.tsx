import { capacityLabel, topPanelBadge } from "@/lib/directory/display";
import { SectionLabel } from "./section-label";
import type { DirectoryCounsel } from "@/types/directory";

// Sticky at-a-glance credentials (wireframe screen 03). Read-only — enquiries
// go through the clerks off-portal, so no CTA lives here.
export function CredentialsRail({ counsel }: { counsel: DirectoryCounsel }) {
  const badge = topPanelBadge(counsel);
  return (
    <div className="rounded-lg border border-line/60 bg-card/60 p-6">
      <SectionLabel>At a glance</SectionLabel>
      <dl className="divide-y divide-line-2">
        {badge && (
          <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <dt className="text-sm text-ink-3">Top panel level</dt>
            <dd className="font-serif text-md text-ink">{badge.name}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <dt className="text-sm text-ink-3">Capacity</dt>
          <dd className="font-serif text-md text-ink">{capacityLabel(counsel.practiceCapacity)}</dd>
        </div>
        {counsel.yearOfCall != null && (
          <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <dt className="text-sm text-ink-3">Year of call</dt>
            <dd className="font-serif text-md text-ink">{counsel.yearOfCall}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
