import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutAction } from "@/actions/auth";
import type { Session } from "@/lib/auth/getSession";

const roleLabel = { student: "Student", instructor: "Instructor", admin: "Admin" } as const;

export function SiteHeader({ profile }: { profile: Session["profile"] | null }) {
  const items: NavItem[] = [{ href: "/", label: "Browse" }];
  if (profile) items.push({ href: "/library", label: "My learning" });
  if (profile && profile.role !== "student") items.push({ href: "/instructor", label: "Teach" });
  if (profile?.role === "admin") items.push({ href: "/admin", label: "Admin" });

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <NavLinks items={items} className="hidden md:flex" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {profile ? (
            <>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 text-sm transition-colors hover:bg-muted sm:pr-3"
                title="Profile settings"
              >
                <Avatar name={profile.full_name ?? profile.email} src={profile.avatar_url} className="size-7" />
                <span className="hidden max-w-[10rem] truncate sm:inline">{profile.full_name ?? profile.email}</span>
                <span className="hidden rounded-full border px-1.5 py-px text-[11px] text-muted-foreground lg:inline">
                  {roleLabel[profile.role]}
                </span>
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" title="Sign out">
                  <LogOut />
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonVariants()}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="border-t px-2 md:hidden">
          <NavLinks items={items} className="overflow-x-auto py-1.5" />
        </div>
      )}
    </header>
  );
}
