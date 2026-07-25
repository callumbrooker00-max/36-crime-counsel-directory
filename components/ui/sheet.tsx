"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Radix Dialog gives us focus trap, Esc-to-close, scrim, and ARIA for free.
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Right sheet (desktop) or bottom sheet (mobile). */
  side?: "right" | "bottom";
  /** Accessible title (rendered visibly unless `hideTitle`). Required by Radix for a11y. */
  title: string;
  hideTitle?: boolean;
  description?: string;
  /** Show the grab handle on the bottom sheet. */
  showHandle?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", title, hideTitle = false, description, showHandle = true, className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-[rgba(23,23,27,0.28)]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-3 bg-card p-4 shadow-overlay focus:outline-none",
        side === "right" && "sheet-right inset-y-0 right-0 h-full w-full max-w-[440px] border-l border-line",
        side === "bottom" && "sheet-bottom inset-x-0 bottom-0 max-h-[90vh] rounded-t-[20px] border-t border-line",
        className,
      )}
      {...props}
    >
      {side === "bottom" && showHandle && (
        <div className="mx-auto h-1 w-9 shrink-0 rounded-full bg-neutral-300" aria-hidden="true" />
      )}
      <div className="flex items-start justify-between gap-4">
        <DialogPrimitive.Title className={cn("font-serif text-lg font-medium text-ink", hideTitle && "sr-only")}>
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          className="rounded-control p-1 text-ink-3 transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label="Close"
        >
          <CloseIcon />
        </DialogPrimitive.Close>
      </div>
      {description && (
        <DialogPrimitive.Description className="text-sm text-ink-2">{description}</DialogPrimitive.Description>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetClose, SheetContent };
