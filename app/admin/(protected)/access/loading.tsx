import { Skeleton } from "@/components/ui/skeleton";

export default function AccessLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-4 h-4 w-80" />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
