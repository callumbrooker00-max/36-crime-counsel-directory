import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the profile layout (wireframe 03) — cold deep-link load.
export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8 lg:px-12">
      <Skeleton className="h-3 w-28" />
      <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <div className="min-w-0 flex-1 space-y-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Skeleton className="size-28 rounded-[14px]" />
            <div className="space-y-3 pb-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-4/5 max-w-prose" />
          </div>
        </div>
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <Skeleton className="h-52 w-full rounded-lg" />
        </aside>
      </div>
    </main>
  );
}
