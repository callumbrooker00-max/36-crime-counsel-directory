"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Centred confirmation dialog. Radix Dialog gives the same a11y floor as Sheet:
// focus trap, Esc-to-close, scrim, ARIA.
const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;

interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
}

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ title, description, className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay fixed inset-0 z-50 bg-[rgba(23,23,27,0.28)]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "modal-content fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-card p-5 shadow-overlay focus:outline-none",
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Title className="font-serif text-lg font-medium text-ink">{title}</DialogPrimitive.Title>
      {description && (
        <DialogPrimitive.Description className="mt-1 text-sm text-ink-2">{description}</DialogPrimitive.Description>
      )}
      <div className="mt-4">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = "ModalContent";

export { Modal, ModalTrigger, ModalClose, ModalContent };
