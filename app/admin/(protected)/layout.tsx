import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { AdminShell } from "@/components/admin/admin-shell";

// Guard: tenant-scoped clerk-or-above of this chambers. proxy.ts already blocks
// unauthenticated requests, so reaching here with no context means an
// authenticated-but-unauthorised account — send it to /admin/no-access, NOT
// /admin/sign-in (proxy would bounce a logged-in user off sign-in back to here,
// looping). See app/admin/no-access/page.tsx.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/no-access");
  return (
    <AdminShell email={ctx.email} role={ctx.role}>
      {children}
    </AdminShell>
  );
}
