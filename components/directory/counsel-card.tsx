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
      className="lift group relative flex flex-col rounded-card border border-line/60 bg-card p-7 shadow-card hover:border-line hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {badge && <Badge variant="panel-level" className="absolute right-6 top-6">{badge.name}</Badge>}

      <Avatar name={counsel.fullName} src={counsel.image?.url} alt={counsel.image?.alt} size="lg" />

      <div className="mt-5">
        <h3 className="line-clamp-2 font-serif text-xl font-medium leading-snug text-ink">{counsel.fullName}</h3>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          {counsel.yearOfCall != null ? `Called ${counsel.yearOfCall} · ` : ""}
          {capacityLabel(counsel.practiceCapacity)}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {primaryArea ? <Badge variant="specialism">{primaryArea.name}</Badge> : <span />}
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 opacity-0 transition-opacity duration-[var(--motion-ui)] group-hover:opacity-100">
          View profile →
        </span>
      </div>
    </Link>
  );
}
