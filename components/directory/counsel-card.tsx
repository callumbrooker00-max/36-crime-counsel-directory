import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { topPanelBadge } from "@/lib/directory/display";
import type { DirectoryCounsel } from "@/types/directory";

export function CounselCard({ counsel }: { counsel: DirectoryCounsel }) {
  const badge = topPanelBadge(counsel);

  return (
    <Link
      href={`/counsel/${counsel.slug}`}
      className="lift group relative flex flex-col rounded-card border border-line/60 bg-card p-7 shadow-card hover:border-line hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {badge && <Badge variant="panel-level" className="absolute right-6 top-6">{badge.name}</Badge>}

      <Avatar name={counsel.fullName} src={counsel.image?.url} alt={counsel.image?.alt} size="lg" />

      <div className="mt-5">
        <h3 className="line-clamp-2 font-serif text-xl font-medium leading-snug text-ink">{counsel.fullName}</h3>
        {counsel.yearOfCall != null && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
            Called {counsel.yearOfCall}
          </p>
        )}
      </div>

      {/* Specialism pill intentionally omitted — counsel hold many specialisms;
          showing one on the card is misleading. Full list lives on the profile. */}
      <div className="mt-6 flex justify-end">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 transition-colors duration-[var(--motion-ui)] group-hover:text-ink">
          View profile →
        </span>
      </div>
    </Link>
  );
}
