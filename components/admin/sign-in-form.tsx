"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/admin/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="flex w-[280px] flex-col gap-3 rounded-card border border-line bg-card p-6">
      <div>
        <p className="font-serif text-md font-semibold text-ink">36 · Crime</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Directory admin</p>
      </div>
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required />
      {state.error && (
        <p role="alert" className="text-sm text-ribbon">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
