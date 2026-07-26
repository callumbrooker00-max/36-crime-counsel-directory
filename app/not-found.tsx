import Link from "next/link";

// Global 404 — calm, branded, one route home (wireframe screen 09).
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-3xl text-neutral-400">404</p>
      <p className="font-serif text-lg font-medium text-ink">This page isn&apos;t here</p>
      <Link
        href="/"
        className="rounded-control border border-line bg-card px-4 py-2 text-sm text-ink transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Back to directory
      </Link>
    </div>
  );
}
