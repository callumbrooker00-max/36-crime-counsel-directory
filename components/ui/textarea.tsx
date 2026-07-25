"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helpText?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helpText, error, id, required, rows = 3, ...props }, ref) => {
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    const helpId = `${fieldId}-help`;
    const errorId = `${fieldId}-error`;
    const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-ink-3">*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-[4.5rem] resize-none rounded-control border bg-card px-3 py-2 text-md text-ink transition-colors [field-sizing:content] placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea";

export { Textarea };
