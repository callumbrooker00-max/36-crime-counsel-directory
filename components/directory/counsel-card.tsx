import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { capacityLabel, topPanelBadge } from "@/lib/directory/display";
import type { DirectoryCounsel } from "@/types/directory";

export function CounselCard({ counsel }: { counsel: DirectoryCounsel }) {
  const badge = topPanelBadge(counsel);
  const primaryArea = counsel.practiceAreas.find((a) => a.isPrimary) ?? counsel.practiceAreas[0];

  return (
    <Link
      href={`/counsel/${counsel.slug}`}
      className="group flex flex-col rounded-card border border-line bg-card p-4 transition-shadow duration-[var(--motion-micro)] hover:shadow-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="flex items-center gap-3">
        <Avatar name={counsel.fullName} src={counsel.image?.url} alt={counsel.image?.alt} size="md" />
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg font-medium leading-tight text-ink">{counsel.fullName}</h3>
          {counsel.yearOfCall != null && (
            <p className="mt-0.5 font-mono text-xs text-ink-3">Called {counsel.yearOfCall}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {badge && <Badge variant="panel-level">{badge.name}</Badge>}
        {primaryArea && <Badge variant="specialism">{primaryArea.name}</Badge>}
      </div>

      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
        {capacityLabel(counsel.practiceCapacity)}
      </p>
    </Link>
  );
}
