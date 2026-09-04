"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const maxWidths = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
} as const;

/**
 * Accessible action dialog. It behaves like a bottom sheet on a phone and a
 * centered modal on larger screens, without moving the page underneath it.
 */
export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  size = "md",
  busy = false,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  size?: keyof typeof maxWidths;
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="sf-modal-overlay fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]" />
        <Dialog.Content
          aria-busy={busy || undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
          className={cn(
            "sf-modal-content fixed inset-x-3 bottom-3 z-[60] flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-lg focus:outline-none",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-3rem)] sm:-translate-x-1/2 sm:-translate-y-1/2",
            maxWidths[size],
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {eyebrow && <p className="brut-label">{eyebrow}</p>}
              <Dialog.Title className="brut-display mt-1 text-2xl text-ink sm:text-3xl">
                {title}
              </Dialog.Title>
              <Dialog.Description
                className={cn(
                  "mt-2 max-w-2xl text-sm leading-6 text-ink-soft",
                  !description && "sr-only",
                )}
              >
                {description ?? "Complete this action or close the dialog."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild disabled={busy}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close dialog"
                disabled={busy}
                className="shrink-0"
              >
                <X aria-hidden size={19} />
              </Button>
            </Dialog.Close>
          </header>
          <div
            className={cn(
              "min-h-0 overflow-y-auto overscroll-contain px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6",
              className,
            )}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
