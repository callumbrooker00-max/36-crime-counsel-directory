"use client";

import { Button } from "@/components/ui/button";

// Keeps chrome, never blank (wireframe screen 09).
export default function DirectoryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="font-serif text-lg font-medium text-ink">Couldn&apos;t load the directory</p>
      <p className="text-md text-ink-2">Something went wrong. Try again.</p>
      <Button variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
