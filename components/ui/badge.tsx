import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-mono text-xs font-medium tracking-[0.04em] whitespace-nowrap",
  {
    variants: {
      variant: {
        // The one place the accent appears on a card — the credential.
        "panel-level": "bg-ribbon-soft text-ribbon px-2 py-0.5",
        specialism: "bg-neutral-100 text-ink-2 px-2 py-0.5",
        capacity: "border border-line text-ink-2 px-2 py-0.5",
        // Publication status.
        published: "bg-ribbon-soft text-ribbon px-2 py-0.5",
        draft: "border border-dashed border-neutral-400 text-ink-3 px-2 py-0.5",
      },
    },
    defaultVariants: { variant: "specialism" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
