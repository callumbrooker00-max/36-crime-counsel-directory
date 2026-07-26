"use client";

import { useActionState } from "react";
import { requestAccessLink, type AccessState } from "@/lib/admin/access-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AccessForm({ denied }: { denied?: boolean }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(requestAccessLink, {});

  if (state.sent) {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full bg-ribbon-soft text-ribbon">
          <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
            <path d="M3 6l7 5 7-5M3 6v8h14V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-serif text-lg font-medium text-ink">Check your email</h1>
        <p className="mt-2 text-md text-ink-2">If that address has access, a link is on its way.</p>
      </div>
    );
  }

  return (
    <form action={action} className="w-full max-w-[420px]">
      <div className="mb-8 text-center">
        <p className="font-serif text-md font-semibold text-ink">36 · Crime</p>
        <p className="mt-2 text-md text-ink-2">
          The crime team counsel directory. Enter your work email to receive a sign-in link.
        </p>
      </div>
      {denied && (
        <p role="alert" className="mb-3 text-center text-sm text-ribbon">
          That link isn&apos;t valid or your access has ended. Request a new link below.
        </p>
      )}
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-ribbon">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending} className="mt-4 w-full">
        Send me a link
      </Button>
      <p className="mt-6 text-center font-mono text-[11px] text-ink-3">
        Access is limited to instructing clients of The 36 Group.
      </p>
    </form>
  );
}
