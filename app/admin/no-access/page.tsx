import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";

// Authenticated, but not an admin of this chambers. The protected layout sends
// unauthorised users HERE rather than to /admin/sign-in — which proxy.ts would
// bounce straight back to /admin/members, forming an infinite redirect. This is
// a plain dead-end with a way out (sign out to switch accounts). It sits outside
// the (protected) group, so it never re-runs the admin-context check.
export const metadata = { title: "No access — 36 Crime admin" };

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-[320px] rounded-card border border-line bg-card p-6 text-center">
        <p className="font-serif text-md font-semibold text-ink">36 · Crime</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Directory admin</p>
        <h1 className="mt-5 font-serif text-lg font-medium text-ink">No admin access</h1>
        <p className="mt-2 text-sm text-ink-2">
          {user?.email ? (
            <>
              The account <span className="font-medium text-ink">{user.email}</span>{" "}
              isn&apos;t an admin of this chambers.{" "}
            </>
          ) : (
            <>This account isn&apos;t an admin of this chambers. </>
          )}
          Ask a chambers admin to grant access, or sign in with a different account.
        </p>
        <form action={signOut} className="mt-5">
          <Button type="submit" variant="primary" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
