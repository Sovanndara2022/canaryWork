import { SiteHeader } from "@/components/layout/site-header";
import { getSession } from "@/lib/auth/getSession";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={session?.profile ?? null} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>Lightning Lessons — short, free video lessons.</span>
          <span>Graduation project · Chanthana HEM &amp; Sovandara Phallim</span>
        </div>
      </footer>
    </div>
  );
}
