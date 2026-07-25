import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "./section-label";
import type { CounselPracticeArea } from "@/types/directory";

export function SpecialismList({ practiceAreas }: { practiceAreas: CounselPracticeArea[] }) {
  if (!practiceAreas.length) return null;
  return (
    <section>
      <SectionLabel>Specialisms</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {practiceAreas.map((a) => (
          <Badge key={a.slug} variant="specialism">
            {a.name}
          </Badge>
        ))}
      </div>
    </section>
  );
}
