"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Always present — no placeholder-only fields (components.md §2.1). */
  label: string;
  helpText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helpText, error, id, required, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;
    const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-ink-3">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 rounded-control border bg-card px-3 text-md text-ink transition-colors duration-[var(--motion-micro)] placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-ribbon" : "border-line",
            className,
          )}
          {...props}
        />
        {helpText && !error && (
          <p id={helpId} className="text-sm text-ink-3">
            {helpText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-ribbon">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
