"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { createMember, publishMember, unpublishMember } from "@/lib/admin/member-actions";

export interface AdminMember {
  id: string;
  fullName: string;
  yearOfCall: number | null;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  topLevel: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MemberRow({ member }: { member: AdminMember }) {
  const { toast } = useToast();
  const [published, setPublished] = React.useState(member.status === "published");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function toggle(next: boolean) {
    setPublished(next); // optimistic
    setSaving(true);
    setSaved(false);
    const res = next ? await publishMember(member.id) : await unpublishMember(member.id);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      toast({ title: next ? "Published" : "Unpublished" });
      setTimeout(() => setSaved(false), 1500);
    } else {
      setPublished(!next); // revert
      toast({ title: res.error ?? "Couldn't save. Retry." });
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <Link href={`/admin/members/${member.id}`} className="truncate font-medium text-ink hover:underline">
          {member.fullName}
        </Link>
        <div className="mt-0.5 font-mono text-[11px] text-ink-3">
          {member.yearOfCall ? `Called ${member.yearOfCall}` : "No call year"}
          {member.topLevel ? ` · ${member.topLevel}` : ""} · Updated {fmtDate(member.updatedAt)}
        </div>
      </div>
      <span className="hidden w-6 text-right text-xs text-ink-3 sm:inline">
        {saved ? "✓" : ""}
      </span>
      <Badge variant={published ? "published" : "draft"}>{published ? "Published" : "Draft"}</Badge>
      <Toggle
        checked={published}
        onCheckedChange={toggle}
        disabled={saving}
        aria-label={`Publish ${member.fullName}`}
      />
      <Link
        href={`/admin/members/${member.id}`}
        className="rounded-control px-2 py-1 text-sm text-ink-2 hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Edit
      </Link>
    </div>
  );
}

export function MemberTable({ members }: { members: AdminMember[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "published" | "draft">("all");

  const filtered = members.filter((m) => {
    if (status === "published" && m.status !== "published") return false;
    if (status === "draft" && m.status === "published") return false;
    if (query.trim() && !m.fullName.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-xl font-medium text-ink">Members</h1>
        <input
          type="search"
          placeholder="Search members…"
          aria-label="Search members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-48 rounded-control border border-line bg-card px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-9 rounded-control border border-line bg-card px-2 text-sm text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <form action={createMember} className="ml-auto">
          <Button type="submit" variant="primary" size="sm">
            Add member
          </Button>
        </form>
      </div>

      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {filtered.length === 0 ? (
          <p className="px-3 py-10 text-center text-md text-ink-2">
            {members.length === 0 ? "No members yet. Add your first." : "No members match."}
          </p>
        ) : (
          filtered.map((m) => <MemberRow key={m.id} member={m} />)
        )}
      </div>
    </div>
  );
}
