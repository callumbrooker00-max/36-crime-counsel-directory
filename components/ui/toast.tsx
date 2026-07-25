"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

export interface ToastOptions {
  /** One-line, verb-echoing message ("Published", "Link copied"). */
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

const ToastContext = React.createContext<{ toast: (opts: ToastOptions) => void } | null>(null);

/** Fire a toast from any client component under <Toaster>. */
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster>");
  return ctx;
}

/** Mounts the toast viewport and provides the `toast()` API. Wrap the app once. */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((opts: ToastOptions) => {
    setToasts((prev) => [...prev, { ...opts, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.durationMs ?? 4000}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(
              "toast-root flex items-center gap-3 rounded-control border border-line bg-ink px-4 py-3 text-white shadow-overlay",
            )}
          >
            <div className="min-w-0">
              <ToastPrimitive.Title className="truncate text-sm font-medium">{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="truncate text-sm text-white/70">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 left-1/2 z-[100] flex w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
