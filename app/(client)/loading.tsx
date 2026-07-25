import { CardGridSkeleton } from "@/components/directory/card-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Layout-matching skeleton while the directory payload loads — never a spinner.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 border-b border-line py-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 max-w-md flex-1" />
        <Skeleton className="ml-auto h-5 w-16" />
      </div>
      <div className="flex gap-8 py-6">
        <div className="hidden w-[240px] shrink-0 space-y-4 md:block">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <CardGridSkeleton />
        </div>
      </div>
    </div>
  );
}
