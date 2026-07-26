import { Button } from "@/components/ui/button";
import { capacityLabel, topPanelBadge } from "@/lib/directory/display";
import { SectionLabel } from "./section-label";
import type { DirectoryCounsel } from "@/types/directory";

// Sticky at-a-glance credentials, then the single red CTA (wireframe screen 03).
export function CredentialsRail({
  counsel,
  onContact,
  onShare,
}: {
  counsel: DirectoryCounsel;
  onContact: () => void;
  onShare: () => void;
}) {
  const badge = topPanelBadge(counsel);
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-line bg-card p-6 shadow-card">
      <div>
        <SectionLabel>At a glance</SectionLabel>
        <dl className="divide-y divide-line-2">
          {badge && (
            <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
              <dt className="text-sm text-ink-3">Top panel level</dt>
              <dd className="font-serif text-md text-ink">{badge.name}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
            <dt className="text-sm text-ink-3">Capacity</dt>
            <dd className="font-serif text-md text-ink">{capacityLabel(counsel.practiceCapacity)}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-col gap-2.5">
        <Button variant="primary" size="md" onClick={onContact}>
          Contact clerks
        </Button>
        <Button variant="secondary" size="md" onClick={onShare}>
          Share profile
        </Button>
      </div>
    </div>
  );
}
