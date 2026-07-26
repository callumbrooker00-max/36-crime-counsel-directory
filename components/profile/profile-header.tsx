import { Avatar } from "@/components/ui/avatar";
import type { DirectoryCounsel } from "@/types/directory";

export function ProfileHeader({ counsel }: { counsel: DirectoryCounsel }) {
  const appointments = counsel.roles.map((r) => r.name).join(" · ");
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
      <Avatar
        name={counsel.fullName}
        src={counsel.image?.url}
        alt={counsel.image?.alt}
        size="xl"
        className="shadow-card"
      />
      <div className="min-w-0 pb-1">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ribbon">Counsel</p>
        <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {counsel.fullName}
        </h1>
        {appointments && <p className="mt-3 text-lg text-ink-2">{appointments}</p>}
        {counsel.yearOfCall != null && (
          <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-ink-3">Called {counsel.yearOfCall}</p>
        )}
      </div>
    </header>
  );
}
