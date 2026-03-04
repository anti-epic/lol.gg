"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/champions", label: "Champions" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
        >
          lol.gg
        </Link>

        <ul className="flex items-center gap-6" role="list">
          {links.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
