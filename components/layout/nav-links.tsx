"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export interface NavItem {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string, exact: string[]) {
  if (exact.includes(href)) return pathname === href;
  if (href === "/") return pathname === "/" || pathname.startsWith("/lessons");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items, className, exact = [] }: { items: NavItem[]; className?: string; exact?: string[] }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href, exact) ? "page" : undefined}
          className="rounded-md px-2.5 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
