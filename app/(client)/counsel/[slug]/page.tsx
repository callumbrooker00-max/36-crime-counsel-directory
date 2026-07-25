import Link from "next/link";
import { notFound } from "next/navigation";
import { getDirectory } from "@/lib/directory/get-directory";
import { Avatar } from "@/components/ui/avatar";

// Placeholder profile so directory cards resolve (and deep links work). The full
// profile (wireframe screen 03) + Contact clerks (04) arrive in slice 5.
export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getDirectory();
  const counsel = payload.counsel.find((c) => c.slug === slug);
  if (!counsel) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.08em] text-ink-3 hover:text-ink">
        ← Back to directory
      </Link>
      <div className="mt-8 flex items-center gap-4">
        <Avatar name={counsel.fullName} src={counsel.image?.url} alt={counsel.image?.alt} size="lg" />
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">{counsel.fullName}</h1>
          {counsel.yearOfCall != null && (
            <p className="mt-1 font-mono text-sm text-ink-3">Called {counsel.yearOfCall}</p>
          )}
        </div>
      </div>
      <p className="mt-8 rounded-card border border-dashed border-line p-4 text-md text-ink-2">
        Full profile coming in the next update.
      </p>
    </main>
  );
}
