import { SectionLabel } from "./section-label";
import type { CounselNotableCase } from "@/types/directory";

export function NotableCasesList({ cases }: { cases: CounselNotableCase[] }) {
  if (!cases.length) return null; // omit the section entirely — no "N/A"
  return (
    <section>
      <SectionLabel>Notable cases</SectionLabel>
      <ul className="flex flex-col gap-5">
        {cases.map((c, i) => {
          const meta = [c.roleInCase, c.year?.toString(), c.court].filter(Boolean).join(" · ");
          return (
            <li key={i}>
              <p className="text-md font-medium text-ink">
                {c.title}
                {c.citation ? <span className="font-normal text-ink-3"> {c.citation}</span> : null}
              </p>
              {meta && <p className="mt-0.5 font-mono text-xs text-ink-3">{meta}</p>}
              {c.summary && <p className="mt-1 max-w-prose text-md text-ink-2">{c.summary}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
