export function ResultCount({ count }: { count: number }) {
  return (
    <p aria-live="polite" className="font-mono text-xs text-ink-2 whitespace-nowrap">
      <span className="font-medium text-ink">{count}</span> {count === 1 ? "counsel" : "counsel"}
    </p>
  );
}
