import { CounselCard } from "./counsel-card";
import type { DirectoryCounsel } from "@/types/directory";

export function CardGrid({ counsel }: { counsel: DirectoryCounsel[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {counsel.map((c) => (
        <CounselCard key={c.id} counsel={c} />
      ))}
    </div>
  );
}
