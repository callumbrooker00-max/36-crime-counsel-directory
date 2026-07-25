import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base skeleton block — shimmer that reduces to a static fill under
 * prefers-reduced-motion (see globals.css). Layout-matching skeletons
 * (card grid, profile, admin row) are composed from this alongside each
 * screen, so a placeholder always mirrors its final layout — never a spinner.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-control", className)} {...props} />;
}

export { Skeleton };
