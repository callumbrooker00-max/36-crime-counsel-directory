"use client";

import { useActionState } from "react";
import { submitAccessCode, type AccessState } from "@/lib/client/access-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AccessForm({ denied }: { denied?: boolean }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(submitAccessCode, {});

  return (
    <form action={action} className="w-full max-w-[420px]">
      <div className="mb-8 text-center">
        <p className="font-serif text-md font-semibold text-ink">36 · Crime</p>
        <p className="mt-2 text-md text-ink-2">
          The crime team counsel directory. Enter the access code your clerk gave you.
        </p>
      </div>
      {denied && (
        <p role="alert" className="mb-3 text-center text-sm text-ribbon">
          Your access has ended. Ask your clerk for a current code.
        </p>
      )}
      <Input
        label="Access code"
        name="code"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        required
      />
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-ribbon">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending} className="mt-4 w-full">
        Enter
      </Button>
      <p className="mt-6 text-center font-mono text-[11px] text-ink-3">
        Access is limited to instructing clients of The 36 Group.
      </p>
    </form>
  );
}
