import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "./section-label";
import type { CounselPanel } from "@/types/directory";

// Panels with grade — the credential a client scans for first (accent badges).
export function PanelBadgeList({ panels }: { panels: CounselPanel[] }) {
  if (!panels.length) return null;
  return (
    <section>
      <SectionLabel>CPS panels</SectionLabel>
      <div className="flex flex-wrap gap-2.5">
        {panels.map((p) => (
          <Badge key={p.panelSlug} variant="panel-level" className="px-3.5 py-1.5 text-sm">
            {p.panelName}
            {p.grade ? ` · ${p.grade}` : ""}
          </Badge>
        ))}
      </div>
    </section>
  );
}
