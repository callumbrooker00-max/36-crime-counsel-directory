"use client";

import { Button } from "@/components/ui/button";

// Global error boundary (wireframe screen 09). Never blanks; a quiet ref for support.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-serif text-lg font-medium text-ink">Something went wrong</p>
      <p className="text-md text-ink-2">Reload the page to try again.</p>
      {error.digest && <p className="font-mono text-xs text-ink-3">Ref {error.digest}</p>}
      <Button variant="secondary" onClick={reset}>
        Reload
      </Button>
    </div>
  );
}
