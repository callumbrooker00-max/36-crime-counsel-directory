"use client";

import { useRouter } from "next/navigation";
import { ProfileHeader } from "./profile-header";
import { PanelBadgeList } from "./panel-badge-list";
import { SpecialismList } from "./specialism-list";
import { NotableCasesList } from "./notable-cases-list";
import { CredentialsRail } from "./credentials-rail";
import { SectionLabel } from "./section-label";
import type { DirectoryCounsel } from "@/types/directory";

function profileHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "chambers site";
  }
}

export function ProfileView({ counsel }: { counsel: DirectoryCounsel }) {
  const router = useRouter();

  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-12">
      <div className="py-6">
        <button
          onClick={() => router.back()}
          className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          ← Back to directory
        </button>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <div className="min-w-0 flex-1 space-y-12">
          <div className="space-y-3">
            <ProfileHeader counsel={counsel} />
            {counsel.profileUrl && (
              <a
                href={counsel.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Full profile at {profileHost(counsel.profileUrl)} ↗
              </a>
            )}
          </div>
          <PanelBadgeList panels={counsel.panels} />
          <SpecialismList practiceAreas={counsel.practiceAreas} />
          {counsel.shortBio && (
            <section>
              <SectionLabel>About</SectionLabel>
              <p className="max-w-prose text-lg leading-relaxed text-ink-2">{counsel.shortBio}</p>
            </section>
          )}
          <NotableCasesList cases={counsel.notableCases} />
        </div>

        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-8">
            <CredentialsRail counsel={counsel} />
          </div>
        </aside>
      </div>
    </main>
  );
}
