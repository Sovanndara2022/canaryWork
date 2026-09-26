import { SiteHeader } from "@/components/layout/site-header";
import { NavLinks } from "@/components/layout/nav-links";
import { requirePageRole } from "@/lib/auth/requireRole";

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/categories", label: "Categories" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profile } = await requirePageRole("admin");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={profile} />
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6">
          <span className="hidden text-sm font-semibold sm:inline">Admin</span>
          <AdminNav />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function AdminNav() {
  // "/admin" should only be active on the overview itself.
  return <NavLinks items={adminNav} exact={["/admin"]} className="overflow-x-auto py-2" />;
}
