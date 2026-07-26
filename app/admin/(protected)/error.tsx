"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-serif text-lg font-medium text-ink">Something went wrong</p>
      <p className="text-md text-ink-2">Try again.</p>
      {error.digest && <p className="font-mono text-xs text-ink-3">Ref {error.digest}</p>}
      <Button variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
