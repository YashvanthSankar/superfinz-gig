"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/**
 * Shared Money action sheet. The parent owns the open state and returns focus
 * to the button that launched it after close.
 */
export function Panel({
  eyebrow,
  title,
  description,
  onClose,
  busy = false,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  onClose: () => void;
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      open
      eyebrow={eyebrow}
      title={title}
      description={description}
      size="lg"
      busy={busy}
      className={className}
      onClose={onClose}
    >
      {children}
    </Modal>
  );
}

export function ActionError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad",
        className,
      )}
    >
      <AlertCircle aria-hidden size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
