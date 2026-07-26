import { SectionLabel } from "./section-label";
import type { CounselNotableCase } from "@/types/directory";

export function NotableCasesList({ cases }: { cases: CounselNotableCase[] }) {
  if (!cases.length) return null; // omit the section entirely — no "N/A"
  return (
    <section>
      <SectionLabel>Notable cases</SectionLabel>
      <ul className="flex flex-col divide-y divide-line-2">
        {cases.map((c, i) => {
          const meta = [c.roleInCase, c.year?.toString(), c.court].filter(Boolean).join(" · ");
          return (
            <li key={i} className="py-5 first:pt-0">
              <p className="font-serif text-lg font-medium leading-snug text-ink">
                {c.title}
                {c.citation ? <span className="font-sans text-md font-normal text-ink-3"> {c.citation}</span> : null}
              </p>
              {meta && <p className="mt-1 font-mono text-xs uppercase tracking-[0.08em] text-ink-3">{meta}</p>}
              {c.summary && <p className="mt-2 max-w-prose text-md leading-relaxed text-ink-2">{c.summary}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
