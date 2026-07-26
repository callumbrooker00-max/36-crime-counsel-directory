"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/admin/image-uploader";
import { CounselCard } from "@/components/directory/counsel-card";
import { saveMember, publishMember, type MemberInput } from "@/lib/admin/member-actions";
import type { DirectoryCounsel, PracticeCapacity } from "@/types/directory";

export interface EditorVocab {
  roles: { id: string; slug: string; name: string }[];
  practiceAreas: { id: string; slug: string; name: string }[];
  panels: { id: string; slug: string; name: string; type: "general" | "specialist" }[];
  grades: { id: string; slug: string; name: string; rank: number }[];
}
export interface EditorMember {
  id: string;
  fullName: string;
  slug: string;
  yearOfCall: number | null;
  practiceCapacity: PracticeCapacity;
  shortBio: string;
  status: "draft" | "published" | "archived";
  headshotUrl: string | null;
  headshotAlt: string | null;
  roleIds: string[];
  areas: { id: string; isPrimary: boolean }[];
  panels: { panelId: string; gradeId: string | null }[];
  cases: EditorCase[];
}
interface EditorCase {
  title: string;
  citation: string;
  year: number | null;
  court: string;
  roleInCase: string;
  summary: string;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-5">
      <h2 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

const CAPACITIES = [
  { value: "prosecution" as const, label: "Prosecution" },
  { value: "defence" as const, label: "Defence" },
  { value: "both" as const, label: "Both" },
];

export function MemberEditor({ member, vocab }: { member: EditorMember; vocab: EditorVocab }) {
  const { toast } = useToast();
  const [fullName, setFullName] = React.useState(member.fullName === "New member" ? "" : member.fullName);
  const [yearOfCall, setYearOfCall] = React.useState<number | null>(member.yearOfCall);
  const [capacity, setCapacity] = React.useState<PracticeCapacity>(member.practiceCapacity);
  const [bio, setBio] = React.useState(member.shortBio);
  const [roleIds, setRoleIds] = React.useState<string[]>(member.roleIds);
  const [areas, setAreas] = React.useState(member.areas);
  const [panels, setPanels] = React.useState(member.panels);
  const [cases, setCases] = React.useState<EditorCase[]>(member.cases);
  const [status, setStatus] = React.useState(member.status);
  const [headshotUrl, setHeadshotUrl] = React.useState<string | null>(member.headshotUrl);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const mark = () => {
    setDirty(true);
    setSaved(false);
  };

  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Reconcile specialism selection with the primary flag.
  const areaIds = areas.map((a) => a.id);
  const onAreasChange = (ids: string[]) => {
    setAreas(ids.map((id) => ({ id, isPrimary: areas.find((a) => a.id === id)?.isPrimary ?? false })));
    mark();
  };
  const setPrimary = (id: string) => {
    setAreas(areas.map((a) => ({ ...a, isPrimary: a.id === id })));
    mark();
  };

  function buildInput(): MemberInput {
    return {
      fullName,
      yearOfCall,
      practiceCapacity: capacity,
      shortBio: bio,
      roleIds,
      areas,
      panels: panels.filter((p) => p.panelId),
      cases,
    };
  }

  async function onSave() {
    setSaving(true);
    const res = await saveMember(member.id, buildInput());
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setDirty(false);
      toast({ title: "Saved" });
    } else {
      toast({ title: res.error ?? "Couldn't save. Retry." });
    }
  }

  async function onPublish() {
    setSaving(true);
    const s = await saveMember(member.id, buildInput());
    if (!s.ok) {
      setSaving(false);
      toast({ title: s.error ?? "Couldn't save. Retry." });
      return;
    }
    const p = await publishMember(member.id);
    setSaving(false);
    if (p.ok) {
      setStatus("published");
      setDirty(false);
      toast({ title: "Published" });
    } else {
      toast({ title: p.error ?? "Couldn't publish." });
    }
  }

  // Live preview — exactly what a client sees on the card.
  const preview: DirectoryCounsel = {
    id: member.id,
    slug: member.slug,
    fullName: fullName || "New member",
    yearOfCall,
    practiceCapacity: capacity,
    shortBio: bio,
    roles: roleIds
      .map((id) => vocab.roles.find((r) => r.id === id))
      .filter(Boolean)
      .map((r) => ({ slug: r!.slug, name: r!.name, abbreviation: null })),
    practiceAreas: areas
      .map((a) => {
        const v = vocab.practiceAreas.find((p) => p.id === a.id);
        return v ? { slug: v.slug, name: v.name, isPrimary: a.isPrimary } : null;
      })
      .filter(Boolean) as DirectoryCounsel["practiceAreas"],
    panels: panels
      .filter((p) => p.panelId)
      .map((p) => {
        const pv = vocab.panels.find((x) => x.id === p.panelId)!;
        const gv = vocab.grades.find((g) => g.id === p.gradeId);
        return { panelSlug: pv.slug, panelName: pv.name, type: pv.type, grade: gv?.name ?? null, gradeRank: gv?.rank ?? null };
      }),
    notableCases: [],
    image: headshotUrl ? { url: headshotUrl, alt: member.headshotAlt ?? fullName } : null,
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col gap-8 pb-24 md:flex-row md:items-start">
      {/* Form */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-serif text-xl font-medium text-ink">{fullName || "New member"}</h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{status}</span>
        </div>

        <div className="flex flex-col gap-5">
          <Section label="Headshot">
            <ImageUploader
              counselId={member.id}
              name={fullName || "New member"}
              initialUrl={member.headshotUrl}
              initialAlt={member.headshotAlt}
              onChange={setHeadshotUrl}
            />
          </Section>

          <Section label="Identity">
            <Input label="Full name" required value={fullName} onChange={(e) => { setFullName(e.target.value); mark(); }} />
            <div className="flex gap-3">
              <div className="w-32">
                <Input
                  label="Year of call"
                  type="number"
                  inputMode="numeric"
                  value={yearOfCall ?? ""}
                  onChange={(e) => { setYearOfCall(e.target.value ? Number(e.target.value) : null); mark(); }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Practice capacity</span>
                <SegmentedControl label="Practice capacity" options={CAPACITIES} value={capacity} onChange={(v) => { setCapacity(v); mark(); }} />
              </div>
            </div>
            <Textarea label="Short bio" value={bio} onChange={(e) => { setBio(e.target.value); mark(); }} />
          </Section>

          <Section label="Appointments">
            <Combobox
              label="Roles"
              placeholder="Add an appointment…"
              options={vocab.roles.map((r) => ({ value: r.id, label: r.name }))}
              value={roleIds}
              onChange={(v) => { setRoleIds(v); mark(); }}
            />
          </Section>

          <Section label="Specialisms">
            <Combobox
              label="Practice areas"
              placeholder="Add a specialism…"
              options={vocab.practiceAreas.map((a) => ({ value: a.id, label: a.name }))}
              value={areaIds}
              onChange={onAreasChange}
            />
            {areas.length > 0 && (
              <Select
                label="Primary specialism"
                placeholder="Choose a headline specialism…"
                options={areas.map((a) => ({ value: a.id, label: vocab.practiceAreas.find((p) => p.id === a.id)?.name ?? a.id }))}
                value={areas.find((a) => a.isPrimary)?.id ?? ""}
                onChange={(e) => setPrimary(e.target.value)}
              />
            )}
          </Section>

          <Section label="CPS panels & grades">
            {panels.map((p, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label={i === 0 ? "Panel" : ""}
                    placeholder="Select a panel…"
                    options={vocab.panels.map((x) => ({ value: x.id, label: x.name }))}
                    value={p.panelId}
                    onChange={(e) => { setPanels(panels.map((row, j) => (j === i ? { ...row, panelId: e.target.value } : row))); mark(); }}
                  />
                </div>
                <div className="w-36">
                  <Select
                    label={i === 0 ? "Grade" : ""}
                    placeholder="— none —"
                    options={[{ value: "", label: "— none —" }, ...vocab.grades.map((g) => ({ value: g.id, label: g.name }))]}
                    value={p.gradeId ?? ""}
                    onChange={(e) => { setPanels(panels.map((row, j) => (j === i ? { ...row, gradeId: e.target.value || null } : row))); mark(); }}
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setPanels(panels.filter((_, j) => j !== i)); mark(); }}>
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setPanels([...panels, { panelId: "", gradeId: null }]); mark(); }}>
                Add panel
              </Button>
            </div>
          </Section>

          <Section label="Notable cases">
            {cases.map((c, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-control border border-line p-3">
                <Input label="Title" value={c.title} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, title: e.target.value } : row))); mark(); }} />
                <div className="flex gap-2">
                  <Input label="Citation" value={c.citation} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, citation: e.target.value } : row))); mark(); }} />
                  <div className="w-24">
                    <Input label="Year" type="number" value={c.year ?? ""} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, year: e.target.value ? Number(e.target.value) : null } : row))); mark(); }} />
                  </div>
                </div>
                <Input label="Court" value={c.court} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, court: e.target.value } : row))); mark(); }} />
                <Input label="Role in case" value={c.roleInCase} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, roleInCase: e.target.value } : row))); mark(); }} />
                <Textarea label="Summary" value={c.summary} onChange={(e) => { setCases(cases.map((row, j) => (j === i ? { ...row, summary: e.target.value } : row))); mark(); }} />
                <div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCases(cases.filter((_, j) => j !== i)); mark(); }}>
                    Remove case
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setCases([...cases, { title: "", citation: "", year: null, court: "", roleInCase: "", summary: "" }]); mark(); }}>
                Add case
              </Button>
            </div>
          </Section>
        </div>
      </div>

      {/* Live preview + save bar */}
      <aside className="w-full shrink-0 md:w-[300px]">
        <div className="sticky top-6 flex flex-col gap-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Client preview</p>
            <CounselCard counsel={preview} />
          </div>
          <div className="flex items-center gap-2 rounded-card border border-line bg-card p-3">
            <span className="text-sm text-ink-3">{saving ? "Saving…" : saved ? "Saved" : dirty ? "Unsaved" : "Up to date"}</span>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onSave} loading={saving}>
                Save
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={onPublish} loading={saving}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
