"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-neutral-200 font-medium text-ink-2",
  {
    variants: {
      size: {
        sm: "size-7 text-xs", // dense lists
        md: "size-11 text-sm", // cards
        lg: "size-16 text-md",
        xl: "size-28 text-2xl", // profile hero
      },
      // Rounded for headshots on a profile; circular in dense lists.
      shape: {
        rounded: "rounded-[14px]",
        circle: "rounded-full",
      },
    },
    defaultVariants: { size: "md", shape: "rounded" },
  },
);

function initialsFrom(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  /** Used for the initials fallback when no image is available. */
  name?: string;
  className?: string;
}

function Avatar({ src, alt, name, size, shape, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size, shape }), className)}>
      {src && (
        <AvatarPrimitive.Image src={src} alt={alt ?? name ?? ""} className="size-full object-cover" />
      )}
      <AvatarPrimitive.Fallback delayMs={src ? 300 : 0} className="flex size-full items-center justify-center">
        {initialsFrom(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar, avatarVariants };
