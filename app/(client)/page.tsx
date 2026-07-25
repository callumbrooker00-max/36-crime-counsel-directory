import { Suspense } from "react";
import { getDirectory } from "@/lib/directory/get-directory";
import { DirectoryClient } from "@/components/directory/directory-client";
import { CardGridSkeleton } from "@/components/directory/card-grid-skeleton";

// The directory is the client portal home (wireframe screen 02). Ungated until
// slice 6; noindex is enforced app-wide (root layout + header).
export default async function DirectoryPage() {
  const payload = await getDirectory();
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8">
          <CardGridSkeleton />
        </div>
      }
    >
      <DirectoryClient payload={payload} />
    </Suspense>
  );
}
