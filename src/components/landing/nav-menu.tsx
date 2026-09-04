"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type NavLinkItem = {
  href: string;
  label: string;
  /** Renders as a quieter, visually separated link (for example "Sign in"). */
  quiet?: boolean;
};

type NavMenuClassNames = {
  list: string;
  quiet: string;
  button: string;
  srOnly: string;
};

type NavMenuProps = {
  links: readonly NavLinkItem[];
  /** Rendered between the link list and the menu button (the header CTA). */
  children?: ReactNode;
  classNames: NavMenuClassNames;
  id?: string;
};

/**
 * Landing navigation links with a mobile disclosure button.
 *
 * On wide viewports the list renders inline and the button is hidden by CSS.
 * Under 900px the list becomes a dropdown panel toggled by the button; it
 * closes on link click, on Escape (returning focus to the button) and on an
 * outside pointer press. The markup is server-rendered, so the page still
 * renders without JavaScript.
 */
export function NavMenu({
  links,
  children,
  classNames,
  id = "landing-nav-links",
}: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (listRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <ul
        id={id}
        ref={listRef}
        className={classNames.list}
        data-open={open ? "true" : undefined}
      >
        {links.map((link) => (
          <li key={link.href} className={link.quiet ? classNames.quiet : undefined}>
            {link.href.startsWith("#") ? (
              <a href={link.href} onClick={close}>
                {link.label}
              </a>
            ) : (
              <Link href={link.href} onClick={close}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {children}
      <button
        ref={buttonRef}
        type="button"
        className={classNames.button}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
        <span className={classNames.srOnly}>Menu</span>
      </button>
    </>
  );
}
