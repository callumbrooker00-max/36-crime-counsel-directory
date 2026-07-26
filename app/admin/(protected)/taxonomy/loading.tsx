import { Skeleton } from "@/components/ui/skeleton";

export default function TaxonomyLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-32" />
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
