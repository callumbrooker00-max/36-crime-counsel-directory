"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ProfileHeader } from "./profile-header";
import { PanelBadgeList } from "./panel-badge-list";
import { SpecialismList } from "./specialism-list";
import { NotableCasesList } from "./notable-cases-list";
import { CredentialsRail } from "./credentials-rail";
import { SectionLabel } from "./section-label";
import { EnquirySheet } from "./enquiry-sheet";
import type { DirectoryCounsel } from "@/types/directory";

export function ProfileView({
  counsel,
  caseTypes,
}: {
  counsel: DirectoryCounsel;
  caseTypes: { value: string; label: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [enquiryOpen, setEnquiryOpen] = React.useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn't copy link" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 pb-28 sm:px-6 md:pb-14 lg:px-8">
      <div className="py-4">
        <button
          onClick={() => router.back()}
          className="font-mono text-xs uppercase tracking-[0.08em] text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          ← Back to directory
        </button>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="min-w-0 flex-1 space-y-8">
          <ProfileHeader counsel={counsel} />
          <PanelBadgeList panels={counsel.panels} />
          <SpecialismList practiceAreas={counsel.practiceAreas} />
          {counsel.shortBio && (
            <section>
              <SectionLabel>About</SectionLabel>
              <p className="max-w-prose text-md leading-relaxed text-ink-2">{counsel.shortBio}</p>
            </section>
          )}
          <NotableCasesList cases={counsel.notableCases} />
        </div>

        <aside className="hidden w-[260px] shrink-0 md:block">
          <div className="sticky top-6">
            <CredentialsRail counsel={counsel} onContact={() => setEnquiryOpen(true)} onShare={share} />
          </div>
        </aside>
      </div>

      {/* Mobile: CTA pinned in thumb reach (wireframe screen 03). */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 p-3 backdrop-blur-sm md:hidden">
        <Button variant="primary" className="w-full" onClick={() => setEnquiryOpen(true)}>
          Contact clerks
        </Button>
      </div>

      <EnquirySheet
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        counsel={{ id: counsel.id, fullName: counsel.fullName }}
        caseTypes={caseTypes}
      />
    </main>
  );
}
