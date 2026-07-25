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
    <div className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
      <div>
        <SectionLabel>At a glance</SectionLabel>
        <dl className="space-y-1.5 text-sm">
          {badge && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Top panel level</dt>
              <dd className="font-medium text-ink">{badge.name}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Capacity</dt>
            <dd className="font-medium text-ink">{capacityLabel(counsel.practiceCapacity)}</dd>
          </div>
        </dl>
      </div>
      <Button variant="primary" onClick={onContact}>
        Contact clerks
      </Button>
      <Button variant="secondary" onClick={onShare}>
        Share
      </Button>
    </div>
  );
}
