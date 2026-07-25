import Link from "next/link";

// Branded, calm, one route home (wireframe screen 09) — for unknown, unpublished
// or archived slugs (api-contract.md §8).
export default function ProfileNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="font-serif text-lg font-medium text-ink">This profile isn&apos;t available</p>
      <p className="text-md text-ink-2">It may have been unpublished, or the link is out of date.</p>
      <Link
        href="/"
        className="rounded-control border border-line bg-card px-4 py-2 text-sm text-ink transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Back to directory
      </Link>
    </div>
  );
}
