// Slice 1: a deliberately blank, on-brand page that proves the pipeline
// (Next + Tailwind v4 + the three fonts + tokens) end to end. Real screens
// arrive from slice 4 onward.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          Counsel directory
        </p>
        <h1 className="mt-3 font-serif text-2xl font-medium tracking-tight text-ink">
          36 · Crime
        </h1>
      </div>
    </main>
  );
}
