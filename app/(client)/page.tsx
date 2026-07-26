import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDirectory } from "@/lib/directory/get-directory";
import { clientAccessStatus, isPermitted } from "@/lib/auth/client-gate";
import { DirectoryClient } from "@/components/directory/directory-client";
import { CardGridSkeleton } from "@/components/directory/card-grid-skeleton";

// Never static: the access gate must run per request (not baked in at build).
export const dynamic = "force-dynamic";

// The directory is the client portal home (wireframe screen 02). Gated by the
// client access model (D1) when CLIENT_GATE_ENABLED; noindex app-wide.
export default async function DirectoryPage() {
  if (!isPermitted(await clientAccessStatus())) redirect("/access");
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
