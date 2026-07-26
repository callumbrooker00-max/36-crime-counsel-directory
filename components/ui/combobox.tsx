"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

/** Searchable multi-select with chips (components.md §2.1). */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
}: {
  label: string;
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const [active, setActive] = React.useState(0);
  // Reset the highlighted option when the query or open-state changes, without an effect.
  const activeKey = `${q}|${open}`;
  const [prevKey, setPrevKey] = React.useState(activeKey);
  if (activeKey !== prevKey) {
    setPrevKey(activeKey);
    setActive(0);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) toggle(filtered[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !q && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-1.5 rounded-control border border-line bg-card p-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-2.5 pr-1 text-sm text-ink-2"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => toggle(v)}
                aria-label={`Remove ${labelFor(v)}`}
                className="rounded-full p-0.5 text-ink-3 hover:bg-neutral-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={`${label}-listbox`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={value.length ? "" : placeholder}
            className="min-w-[6rem] flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-3"
          />
        </div>
        {open && filtered.length > 0 && (
          <ul id={`${label}-listbox`} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-control border border-line bg-card py-1 shadow-overlay">
            {filtered.map((o, i) => {
              const selected = value.includes(o.value);
              return (
                <li key={o.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus so the list stays open
                      toggle(o.value);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm",
                      i === active ? "bg-neutral-100" : "",
                      selected ? "text-ink" : "text-ink-2",
                    )}
                  >
                    {o.label}
                    {selected && (
                      <svg viewBox="0 0 16 16" className="size-3.5 text-ribbon" fill="none" aria-hidden="true">
                        <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
