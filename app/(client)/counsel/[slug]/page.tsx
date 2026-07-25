import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDirectory } from "@/lib/directory/get-directory";
import { ProfileView } from "@/components/profile/profile-view";

async function findCounsel(slug: string) {
  const payload = await getDirectory();
  return { payload, counsel: payload.counsel.find((c) => c.slug === slug) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { counsel } = await findCounsel(slug);
  // Resolve the slug here — before the response head commits — so an unknown,
  // unpublished or archived slug (all absent from the published payload) yields
  // a true HTTP 404, not a 200 with the not-found body streamed in.
  if (!counsel) notFound();
  return { title: `${counsel.fullName} — 36 Crime` };
}

// Full profile (wireframe screen 03), deep-linkable. Unknown/unpublished slug
// → notFound() → branded not-found.tsx + 404.
export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { payload, counsel } = await findCounsel(slug);
  if (!counsel) notFound();

  const caseTypes = payload.filters.practiceAreas.map((a) => ({ value: a.name, label: a.name }));
  return <ProfileView counsel={counsel} caseTypes={caseTypes} />;
}
