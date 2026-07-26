import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="min-w-0 flex-1 space-y-5">
        <Skeleton className="h-7 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 border-t border-line pt-5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-2/3" />
          </div>
        ))}
      </div>
      <aside className="w-full shrink-0 md:w-[300px]">
        <Skeleton className="h-40 w-full rounded-card" />
      </aside>
    </div>
  );
}
