import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the profile layout (wireframe 03) — cold deep-link load.
export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-3 w-28" />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start">
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 rounded-[12px]" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full max-w-prose" />
            <Skeleton className="h-3 w-4/5 max-w-prose" />
          </div>
        </div>
        <aside className="hidden w-[260px] shrink-0 md:block">
          <Skeleton className="h-40 w-full rounded-card" />
        </aside>
      </div>
    </main>
  );
}
