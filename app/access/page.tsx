import { AccessForm } from "@/components/access/access-form";

// The threshold (wireframe 01). Public — the entry to the gated portal.
export const metadata = { title: "36 Crime Counsel Directory" };

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <AccessForm denied={denied === "1"} />
    </div>
  );
}
