"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Modal, ModalContent, ModalClose } from "@/components/ui/modal";
import {
  createAccessCode,
  regenerateCode,
  revokeAccess,
  restoreAccess,
  deleteAccess,
} from "@/lib/admin/access-list-actions";

export interface AccessRow {
  id: string;
  label: string;
  code: string;
  issuedAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Group into 4s purely for legibility; the code itself has no separators.
const pretty = (code: string) => code.replace(/(.{4})(?=.)/g, "$1 ").trim();

function CopyButton({ code }: { code: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          toast({ title: "Code copied" });
        } catch {
          toast({ title: "Couldn't copy — select it manually." });
        }
      }}
      aria-label={`Copy code for later`}
      className="rounded-control px-1.5 py-0.5 text-ink-3 hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 11V4a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function Row({ row, onAskDelete }: { row: AccessRow; onAskDelete: (r: AccessRow) => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const run = (p: Promise<{ ok: boolean; error?: string; code?: string }>, okMsg: string) =>
    start(async () => {
      const res = await p;
      if (res.ok) {
        toast({ title: res.code ? `${okMsg} — new code ${pretty(res.code)}` : okMsg });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't save. Retry." });
    });

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 ${row.revoked ? "opacity-60" : ""}`}>
      <span className="min-w-0 truncate text-md text-ink">{row.label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-sm tracking-wider text-ink-2">{pretty(row.code)}</span>
        {!row.revoked && <CopyButton code={row.code} />}
        {row.revoked && <Badge variant="capacity">Revoked</Badge>}
      </span>
      <span className="ml-auto shrink-0 font-mono text-xs text-ink-3">
        {row.lastUsedAt ? `Last used ${fmtDate(row.lastUsedAt)}` : `Added ${fmtDate(row.issuedAt)}`}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {row.revoked ? (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(restoreAccess(row.id), "Restored")}>
            Restore
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(regenerateCode(row.id), "Rotated")}>
              New code
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(revokeAccess(row.id), "Revoked")}>
              Revoke
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onAskDelete(row)} className="text-ink-3 hover:text-ribbon">
          Delete
        </Button>
      </div>
    </div>
  );
}

export function AccessAdmin({ rows }: { rows: AccessRow[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [confirm, setConfirm] = React.useState<AccessRow | null>(null);
  const [justCreated, setJustCreated] = React.useState<{ label: string; code: string } | null>(null);
  const [, start] = React.useTransition();

  const create = () =>
    start(async () => {
      const res = await createAccessCode(label);
      if (res.ok && res.code) {
        setJustCreated({ label: label.trim(), code: res.code });
        setLabel("");
        toast({ title: "Access code created" });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't create." });
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

  const canAdd = label.trim() !== "";

  return (
    <div>
      <h1 className="mb-1 font-serif text-xl font-medium text-ink">Client access</h1>
      <p className="mb-4 max-w-prose text-sm text-ink-2">
        Give each client firm a code to sign in to the directory. Create one below, then share the code with them.
        Revoke it any time — access stops on their next request.
      </p>

      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canAdd && create()}
          placeholder="Firm or team name"
          aria-label="Firm or team name"
          className="h-9 flex-1 rounded-control border border-line bg-card px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <Button type="button" variant="secondary" size="sm" onClick={create} disabled={!canAdd}>
          Create code
        </Button>
      </div>

      {justCreated && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-ribbon bg-ribbon-soft px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Code for {justCreated.label}</p>
            <p className="font-mono text-lg tracking-wider text-ink">{pretty(justCreated.code)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <CopyButton code={justCreated.code} />
            <Button type="button" variant="ghost" size="sm" onClick={() => setJustCreated(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-md text-ink-2">No access codes yet. Create one above.</p>
        ) : (
          rows.map((r) => <Row key={r.id} row={r} onAskDelete={setConfirm} />)
        )}
      </div>

      <Modal open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <ModalContent
            title={`Delete access for "${confirm.label}"?`}
            description="This removes the record entirely. To keep an audit trail, revoke instead — that also stops sign-in immediately."
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
