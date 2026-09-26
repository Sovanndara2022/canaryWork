import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth";
import { homePathFor, type Session } from "@/lib/auth/getSession";

const roleLabel = { student: "Student", instructor: "Instructor", admin: "Admin" } as const;

export function SiteHeader({ profile }: { profile: Session["profile"] }) {
  const links = [
    ...(profile.role !== "student" ? [{ href: "/instructor", label: "My lessons" }] : []),
    ...(profile.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link href={homePathFor(profile.role)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm sm:inline">{profile.full_name ?? profile.email}</span>
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            {roleLabel[profile.role]}
          </span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
