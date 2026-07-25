"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink-3">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export function Gallery() {
  const { toast } = useToast();
  const [published, setPublished] = React.useState(true);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ribbon">Design system · dev</p>
      <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight text-ink">Component gallery</h1>
      <p className="mt-2 text-md text-ink-2">Slice 2 primitives — every state, on one page.</p>

      <Section title="Button">
        <Button variant="primary">Send enquiry</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Clear all</Button>
        <Button variant="destructive">Retire term</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" loading>
          Sending
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Section>

      <Section title="Input">
        <div className="w-64">
          <Input label="Email" type="email" placeholder="you@firm.example" helpText="We'll reply here." />
        </div>
        <div className="w-64">
          <Input label="Year of call" required error="Year of call is required to publish." defaultValue="" />
        </div>
      </Section>

      <Section title="Badge">
        <Badge variant="panel-level">Level 4</Badge>
        <Badge variant="specialism">Serious sexual offences</Badge>
        <Badge variant="capacity">Prosecution</Badge>
        <Badge variant="published">Published</Badge>
        <Badge variant="draft">Draft</Badge>
      </Section>

      <Section title="Avatar">
        <Avatar name="A Chen" size="sm" shape="circle" />
        <Avatar name="Daniel Okafor" size="md" shape="rounded" />
        <Avatar name="Rowan Vale" size="lg" shape="rounded" />
      </Section>

      <Section title="Toggle — publish state">
        <div className="flex items-center gap-3">
          <Toggle checked={published} onCheckedChange={setPublished} aria-label="Publish" />
          <span className="text-sm text-ink-2">{published ? "Published" : "Draft"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Toggle disabled aria-label="Disabled toggle" />
          <span className="text-sm text-ink-3">Disabled</span>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="w-64 space-y-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Section>

      <Section title="Sheet">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open right sheet</Button>
          </SheetTrigger>
          <SheetContent side="right" title="Contact clerks" description="Pre-referencing this counsel.">
            <p className="text-md text-ink-2">Right sheet — focus-trapped, Esc to close.</p>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open bottom sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom" title="Filters" description="Mobile bottom sheet.">
            <p className="text-md text-ink-2">Bottom sheet with a grab handle.</p>
          </SheetContent>
        </Sheet>
      </Section>

      <Section title="Toast">
        <Button variant="secondary" onClick={() => toast({ title: "Published" })}>
          Fire toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast({ title: "Link copied", description: "Profile URL on your clipboard." })}
        >
          Toast with detail
        </Button>
      </Section>
    </main>
  );
}
