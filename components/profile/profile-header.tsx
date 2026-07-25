import { Avatar } from "@/components/ui/avatar";
import type { DirectoryCounsel } from "@/types/directory";

export function ProfileHeader({ counsel }: { counsel: DirectoryCounsel }) {
  const appointments = counsel.roles.map((r) => r.name).join(" · ");
  return (
    <header className="flex items-start gap-4">
      <Avatar name={counsel.fullName} src={counsel.image?.url} alt={counsel.image?.alt} size="lg" />
      <div className="pt-1">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">{counsel.fullName}</h1>
        {appointments && <p className="mt-1 text-md text-ink-2">{appointments}</p>}
        {counsel.yearOfCall != null && (
          <p className="mt-0.5 font-mono text-xs text-ink-3">Called {counsel.yearOfCall}</p>
        )}
      </div>
    </header>
  );
}
