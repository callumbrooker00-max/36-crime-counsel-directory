"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Base switch primitive. The `on` state uses the accent — this is the admin
 * publish control, where "Published" is the one red thing in the row.
 * The optimistic saving/Saved-tick behaviour is layered on in the admin
 * PublishToggle composite (slice 6); this stays a clean, controllable switch.
 */
const Toggle = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-[var(--motion-micro)] ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-ribbon data-[state=unchecked]:bg-neutral-300",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-[var(--motion-micro)] ease-out-soft data-[state=checked]:translate-x-[22px]" />
  </SwitchPrimitive.Root>
));
Toggle.displayName = "Toggle";

export { Toggle };
