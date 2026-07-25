"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-colors duration-[var(--motion-micro)] ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Only one `primary` per view — it's the single ribbon-red action.
        primary: "bg-ribbon text-white hover:bg-ribbon-hover active:bg-ribbon-active",
        secondary: "border border-line bg-card text-ink hover:bg-neutral-100 active:bg-neutral-200",
        ghost: "text-ink-2 hover:bg-neutral-100 hover:text-ink active:bg-neutral-200",
        // Destructive reads as red without competing with the filled primary.
        destructive: "border border-ribbon bg-transparent text-ribbon hover:bg-ribbon-soft active:bg-ribbon-soft",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-md",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

function Spinner() {
  return (
    <svg
      className="spinner-ring size-4"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. wrap a link or a whole card). */
  asChild?: boolean;
  /** Show an inline spinner and disable the button (action feedback). */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    // Slot forwards to the child, so the spinner affordance only applies to real buttons.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
