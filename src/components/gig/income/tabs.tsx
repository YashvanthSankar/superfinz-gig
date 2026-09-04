"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { id: T; label: string };

/**
 * WAI-ARIA tabs: roving tabindex, Left/Right/Home/End keys. The parent renders
 * the matching `role="tabpanel"` with id `${idPrefix}-panel-${value}`.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
}: {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (next: T) => void;
  label: string;
  idPrefix: string;
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const targets: Record<string, number | undefined> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = items[(next + items.length) % items.length];
    onChange(target.id);
    buttons.current.get(target.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 rounded-2xl border border-line bg-paper-2 p-1 shadow-sm"
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) buttons.current.set(item.id, node);
              else buttons.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={selected ? `${idPrefix}-panel-${item.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors duration-200",
              selected
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-soft hover:bg-surface/70 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
