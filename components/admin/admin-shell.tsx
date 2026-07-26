import Link from "next/link";
import { signOut } from "@/lib/admin/auth-actions";

// Quieter, more utilitarian than the client side — the shift in tone signals
// back-of-house (wireframe 06/07).
export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1100px] items-center gap-5 px-4 py-3">
          <Link href="/admin/members" className="font-serif text-md font-semibold text-ink">
            36 · Crime <span className="ml-1 font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-ink-3">Admin</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            <Link href="/admin/members" className="rounded-control px-2 py-1 text-ink-2 hover:bg-neutral-100 hover:text-ink">
              Members
            </Link>
            <Link href="/admin/taxonomy" className="rounded-control px-2 py-1 text-ink-2 hover:bg-neutral-100 hover:text-ink">
              Taxonomy
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-ink-3">
            <span className="hidden sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-control px-2 py-1 text-ink-2 hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-6">{children}</main>
    </div>
  );
}
