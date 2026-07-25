"use client";

import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { enquirySchema, URGENCY_OPTIONS } from "@/lib/validation/enquiry";

type Urgency = "routine" | "soon" | "urgent";
type Status = "idle" | "sending" | "success";

export interface EnquiryCounsel {
  id: string;
  fullName: string;
}

const OTHER = "Other";

export function EnquirySheet({
  open,
  onOpenChange,
  counsel,
  caseTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counsel?: EnquiryCounsel | null;
  caseTypes: { value: string; label: string }[];
}) {
  const [included, setIncluded] = React.useState(true);
  const [name, setName] = React.useState("");
  const [firm, setFirm] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [caseType, setCaseType] = React.useState("");
  const [urgency, setUrgency] = React.useState<Urgency>("routine");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [banner, setBanner] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");

  const dirty = Boolean(name || firm || email || caseType || message);

  function reset() {
    setIncluded(true);
    setName("");
    setFirm("");
    setEmail("");
    setCaseType("");
    setUrgency("routine");
    setMessage("");
    setErrors({});
    setBanner(null);
    setStatus("idle");
  }

  function handleOpenChange(next: boolean) {
    // Dirty-close confirm (wireframe screen 04).
    if (!next && dirty && status !== "success") {
      if (!window.confirm("Discard this enquiry?")) return;
    }
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      counselIds: included && counsel ? [counsel.id] : [],
      enquirerName: name,
      firm,
      email,
      caseType,
      urgency,
      message,
    };
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0]);
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setBanner(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.status === 202) {
        setStatus("success");
        return;
      }
      const body = await res.json().catch(() => null);
      if (res.status === 400 && body?.error?.fields) {
        setErrors(body.error.fields);
        setStatus("idle");
        return;
      }
      setBanner(body?.error?.message ?? "Couldn't send. Retry.");
      setStatus("idle");
    } catch {
      setBanner("Couldn't send. Retry.");
      setStatus("idle");
    }
  }

  const caseTypeOptions = [...caseTypes, { value: OTHER, label: OTHER }];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" title="Contact clerks" description="The clerks will reply to you directly.">
        {status === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-ribbon-soft text-ribbon">
              <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-serif text-lg font-medium text-ink">Enquiry sent</p>
            <p className="max-w-xs text-md text-ink-2">
              The clerks will reply to <span className="text-ink">{email}</span>.
            </p>
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
              {counsel && included && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-ribbon-soft py-0.5 pl-3 pr-1 text-sm text-ribbon">
                    {counsel.fullName}
                    <button
                      type="button"
                      onClick={() => setIncluded(false)}
                      aria-label={`Remove ${counsel.fullName}`}
                      className="rounded-full p-0.5 hover:bg-ribbon/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}

              {banner && (
                <p role="alert" className="rounded-control border border-ribbon bg-ribbon-soft px-3 py-2 text-sm text-ribbon">
                  {banner}
                </p>
              )}

              <Input
                label="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.enquirerName}
                autoComplete="name"
              />
              <Input
                label="Firm"
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                error={errors.firm}
                autoComplete="organization"
              />
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
              <Select
                label="Case type"
                placeholder="Select a case type…"
                options={caseTypeOptions}
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                error={errors.caseType}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Urgency</span>
                <SegmentedControl<Urgency>
                  label="Urgency"
                  options={URGENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={urgency}
                  onChange={setUrgency}
                />
              </div>
              <Textarea
                label="Message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                error={errors.message}
                helpText={
                  caseType === OTHER
                    ? "Tell the clerks the case type and any detail — hearing date, court, anything relevant."
                    : "Case type, hearing date, court, anything relevant."
                }
              />
            </div>

            <Button type="submit" variant="primary" loading={status === "sending"} className="w-full">
              Send enquiry
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
