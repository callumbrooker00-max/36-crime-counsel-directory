import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the CounselCard layout so the placeholder matches the final grid. */
export function CardGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-card border border-line bg-card p-6 shadow-card">
          <div className="flex items-start gap-4">
            <Skeleton className="size-11 rounded-[14px]" />
            <div className="flex-1 space-y-2.5 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-line-2 pt-4">
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
