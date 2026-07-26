import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "./section-label";
import type { CounselPracticeArea } from "@/types/directory";

export function SpecialismList({ practiceAreas }: { practiceAreas: CounselPracticeArea[] }) {
  if (!practiceAreas.length) return null;
  return (
    <section>
      <SectionLabel>Specialisms</SectionLabel>
      <div className="flex flex-wrap gap-2.5">
        {practiceAreas.map((a) => (
          <Badge key={a.slug} variant="specialism" className="px-3.5 py-1.5 text-sm">
            {a.name}
          </Badge>
        ))}
      </div>
    </section>
  );
}
