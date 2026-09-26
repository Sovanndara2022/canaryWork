import { SiteHeader } from "@/components/layout/site-header";
import { requirePageRole } from "@/lib/auth/requireRole";

export default async function InstructorLayout({ children }: LayoutProps<"/instructor">) {
  const { profile } = await requirePageRole("instructor", "admin");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
