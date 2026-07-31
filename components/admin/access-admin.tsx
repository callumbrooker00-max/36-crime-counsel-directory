"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Modal, ModalContent, ModalClose } from "@/components/ui/modal";
import { addAccess, revokeAccess, restoreAccess, deleteAccess } from "@/lib/admin/access-list-actions";

export interface AccessRow {
  id: string;
  label: string;
  matcher: string;
  kind: "email" | "domain";
  issuedAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Row({ row, onAskDelete }: { row: AccessRow; onAskDelete: (r: AccessRow) => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const run = (p: Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const res = await p;
      if (res.ok) {
        toast({ title: okMsg });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't save. Retry." });
    });

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 ${row.revoked ? "opacity-60" : ""}`}>
      <span className="min-w-0 truncate text-md text-ink">{row.label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-sm text-ink-2">{row.matcher}</span>
        <Badge variant="specialism">{row.kind === "domain" ? "Whole firm" : "One person"}</Badge>
      </span>
      <span className="ml-auto shrink-0 font-mono text-xs text-ink-3">
        {row.revoked
          ? "Revoked"
          : row.lastUsedAt
            ? `Last used ${fmtDate(row.lastUsedAt)}`
            : `Added ${fmtDate(row.issuedAt)}`}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {row.revoked ? (
          <>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(restoreAccess(row.id), "Restored")}>
              Restore
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onAskDelete(row)} className="text-ink-3 hover:text-ribbon">
              Delete
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(revokeAccess(row.id), "Revoked")}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

export function AccessAdmin({ rows }: { rows: AccessRow[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [matcher, setMatcher] = React.useState("");
  const [confirm, setConfirm] = React.useState<AccessRow | null>(null);
  const [, start] = React.useTransition();

  const add = () =>
    start(async () => {
      const res = await addAccess(label, matcher);
      if (res.ok) {
        setLabel("");
        setMatcher("");
        toast({ title: "Access granted" });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't add." });
    });

  const doDelete = (r: AccessRow) =>
    start(async () => {
      const res = await deleteAccess(r.id);
      setConfirm(null);
      if (res.ok) {
        toast({ title: "Deleted" });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't delete." });
    });

  const canAdd = label.trim() !== "" && matcher.trim() !== "";
  const isDomain = !matcher.includes("@") && matcher.trim() !== "";

  return (
    <div>
      <h1 className="mb-1 font-serif text-xl font-medium text-ink">Client access</h1>
      <p className="mb-4 max-w-prose text-sm text-ink-2">
        Who can sign in to the directory. Add one person by email, or a whole firm by domain (e.g.{" "}
        <span className="font-mono">cps.gov.uk</span>). Only these addresses receive a sign-in link.
      </p>

      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Firm or team name"
          aria-label="Firm or team name"
          className="h-9 flex-1 rounded-control border border-line bg-card px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <input
          value={matcher}
          onChange={(e) => setMatcher(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canAdd && add()}
          placeholder="Email or firm domain"
          aria-label="Email address or firm domain"
          className="h-9 flex-1 rounded-control border border-line bg-card px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!canAdd}>
          Add
        </Button>
      </div>
      <p className="mb-4 h-4 text-xs text-ink-3">
        {matcher.trim() === "" ? "" : isDomain ? "Grants access to everyone at this domain." : "Grants access to this one address."}
      </p>

      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-md text-ink-2">No one has access yet. Add a firm or address above.</p>
        ) : (
          rows.map((r) => <Row key={r.id} row={r} onAskDelete={setConfirm} />)
        )}
      </div>

      <Modal open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <ModalContent
            title={`Delete access for "${confirm.label}"?`}
            description="This removes the record entirely. To keep an audit trail, revoke instead — that also blocks sign-in immediately."
          >
            <div className="flex justify-end gap-2">
              <ModalClose asChild>
                <Button type="button" variant="secondary" size="sm">
                  Cancel
                </Button>
              </ModalClose>
              <Button type="button" variant="destructive" size="sm" onClick={() => doDelete(confirm)}>
                Delete
              </Button>
            </div>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}
