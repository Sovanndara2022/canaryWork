import { SiteHeader } from "@/components/layout/site-header";
import { requirePageRole } from "@/lib/auth/requireRole";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requirePageRole("instructor", "admin");

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </>
  );
}
