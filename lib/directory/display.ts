import type { DirectoryCounsel, PracticeCapacity } from "@/types/directory";

export function capacityLabel(capacity: PracticeCapacity): string {
  if (capacity === "both") return "Prosecution & defence";
  if (capacity === "prosecution") return "Prosecution";
  return "Defence";
}

/** The headline credential shown on a card: the counsel's highest CPS grade. */
export function topPanelBadge(counsel: DirectoryCounsel): { rank: number; name: string } | null {
  const graded = counsel.panels.filter((p) => p.gradeRank != null);
  if (!graded.length) return null;
  const top = graded.reduce((a, b) => ((b.gradeRank ?? 0) > (a.gradeRank ?? 0) ? b : a));
  return { rank: top.gradeRank as number, name: top.grade as string };
}
