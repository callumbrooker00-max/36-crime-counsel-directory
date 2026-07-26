import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="ml-auto h-8 w-28" />
      </div>
      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
