import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin-context";
import { AdminShell } from "@/components/admin/admin-shell";

// Guard: tenant-scoped clerk-or-above of this chambers. proxy.ts already blocks
// unauthenticated requests; this also rejects authenticated non-members.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/sign-in");
  return <AdminShell email={ctx.email}>{children}</AdminShell>;
}
