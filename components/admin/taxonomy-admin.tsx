"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Modal, ModalContent, ModalClose } from "@/components/ui/modal";
import {
  createTerm,
  renameTerm,
  setTermActive,
  deleteTerm,
  reorderTerm,
  type TaxonomyKind,
} from "@/lib/admin/taxonomy-actions";

export interface Term {
  id: string;
  name: string;
  usage: number;
  editable: boolean;
  isActive: boolean;
}
export interface TaxonomyData {
  practiceAreas: Term[];
  roles: Term[];
  panels: Term[];
  grades: Term[];
}

const TABS: { key: keyof TaxonomyData; label: string; kind: TaxonomyKind | null }[] = [
  { key: "practiceAreas", label: "Specialisms", kind: "practice-areas" },
  { key: "roles", label: "Appointments", kind: "roles" },
  { key: "panels", label: "CPS panels", kind: "panels" },
  { key: "grades", label: "Levels", kind: null }, // national, read-only
];

function TermRow({
  term,
  kind,
  onAskDelete,
}: {
  term: Term;
  kind: TaxonomyKind;
  onAskDelete: (t: Term) => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = React.useState(term.name);
  const [pending, start] = React.useTransition();

  const run = (p: Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    start(async () => {
      const res = await p;
      if (res.ok) {
        if (okMsg) toast({ title: okMsg });
        router.refresh(); // programmatic server-action call — refresh RSC props
      } else {
        toast({ title: res.error ?? "Couldn't save. Retry." });
      }
    });

  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${term.isActive ? "" : "opacity-60"}`}>
      {term.editable ? (
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label="Move up"
            onClick={() => run(reorderTerm(kind, term.id, "up"))}
            className="text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none"><path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={() => run(reorderTerm(kind, term.id, "down"))}
            className="text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      ) : (
        <span className="w-3 shrink-0" />
      )}

      {term.editable ? (
        <input
          value={name}
          disabled={pending}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== term.name && run(renameTerm(kind, term.id, name), "Renamed")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label={`Rename ${term.name}`}
          className="min-w-0 flex-1 rounded-control bg-transparent px-1 py-0.5 text-md text-ink hover:bg-neutral-100 focus:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-md text-ink">{term.name}</span>
          <Badge variant="capacity">Central</Badge>
        </span>
      )}

      <span className="shrink-0 font-mono text-xs text-ink-3">
        {term.usage > 0 ? `Used by ${term.usage}` : "Unused"}
      </span>

      {term.editable && (
        <div className="flex shrink-0 items-center gap-1">
          {term.isActive ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => run(setTermActive(kind, term.id, false), "Retired")}>
              Retire
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => run(setTermActive(kind, term.id, true), "Restored")}>
              Restore
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAskDelete(term)}
            className="text-ink-3 hover:text-ribbon"
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

function TermList({ kind, terms, canAdd }: { kind: TaxonomyKind; terms: Term[]; canAdd: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [adding, setAdding] = React.useState("");
  const [confirm, setConfirm] = React.useState<Term | null>(null);
  const [, start] = React.useTransition();

  const add = () =>
    start(async () => {
      const res = await createTerm(kind, adding);
      if (res.ok) {
        setAdding("");
        toast({ title: "Added" });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't add." });
    });

  const doDelete = (t: Term) =>
    start(async () => {
      const res = await deleteTerm(kind, t.id, t.usage);
      setConfirm(null);
      if (res.ok) {
        toast({ title: "Deleted" });
        router.refresh();
      } else toast({ title: res.error ?? "Couldn't delete." });
    });

  return (
    <div>
      <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
        {terms.length === 0 ? (
          <p className="px-3 py-8 text-center text-md text-ink-2">Nothing here yet.</p>
        ) : (
          terms.map((t) => <TermRow key={t.id} term={t} kind={kind} onAskDelete={setConfirm} />)
        )}
      </div>
      {canAdd && (
        <div className="mt-3 flex gap-2">
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adding.trim() && add()}
            placeholder="Add a term…"
            aria-label="Add a term"
            className="h-9 flex-1 rounded-control border border-line bg-card px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!adding.trim()}>
            Add
          </Button>
        </div>
      )}

      <Modal open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <ModalContent
            title={`Delete "${confirm.name}"?`}
            description={
              confirm.usage > 0
                ? `In use by ${confirm.usage} counsel — retire it instead to keep their records intact.`
                : "This can't be undone."
            }
          >
            <div className="flex justify-end gap-2">
              <ModalClose asChild>
                <Button type="button" variant="secondary" size="sm">
                  Cancel
                </Button>
              </ModalClose>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={confirm.usage > 0}
                onClick={() => doDelete(confirm)}
              >
                Delete
              </Button>
            </div>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}

export function TaxonomyAdmin({ data }: { data: TaxonomyData }) {
  const [tab, setTab] = React.useState<keyof TaxonomyData>("practiceAreas");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-medium text-ink">Taxonomy</h1>
      <div role="tablist" aria-label="Taxonomy kinds" className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              tab === t.key ? "border-ribbon bg-ribbon-soft text-ribbon" : "border-line bg-card text-ink-2 hover:bg-neutral-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active.kind ? (
        <TermList kind={active.kind} terms={data[tab]} canAdd />
      ) : (
        <div>
          <p className="mb-3 text-sm text-ink-2">CPS levels are national and maintained centrally.</p>
          <div className="divide-y divide-line-2 overflow-hidden rounded-card border border-line bg-card">
            {data.grades.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2">
                <span className="flex-1 text-md text-ink">{g.name}</span>
                <Badge variant="capacity">Central</Badge>
                <span className="font-mono text-xs text-ink-3">{g.usage > 0 ? `Used by ${g.usage}` : "Unused"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
