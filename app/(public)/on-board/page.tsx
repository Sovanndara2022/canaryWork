import Link from "next/link";
import { becomeInstructorAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AreaBackdrop } from "@/components/layout/area-backdrop";
import { SiteHeader } from "@/components/layout/site-header";
import { requirePageRole } from "@/lib/auth/requireRole";
import { PlayCircle, Presentation } from "lucide-react";

export default async function OnBoardPage() {
  const { profile } = await requirePageRole();
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div data-area="student" className="relative isolate flex min-h-screen flex-col">
      <AreaBackdrop />
      <SiteHeader profile={profile} />

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is ready. How do you want to start?
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {/* This project's Button wraps @base-ui/react, which uses a `render`
                prop for polymorphism, not Radix/shadcn's `asChild` — see
                https://base-ui.com/react/utils/use-render */}
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              className="h-auto w-full justify-start gap-4 p-4 text-left"
            >
              <PlayCircle className="size-5" />
              <span className="flex flex-col gap-0.5 whitespace-normal">
                <span className="font-medium">Browse lessons</span>
                <span className="text-xs font-normal opacity-70">Watch, save, and track your progress.</span>
              </span>
            </Button>

            {profile.role === "student" && (
              <form action={becomeInstructorAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full justify-start gap-4 p-4 text-left"
                >
                  <Presentation className="size-5" />
                  <span className="flex flex-col gap-0.5 whitespace-normal">
                    <span className="font-medium">Start teaching</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Publish your own lessons. Each one is reviewed before it goes live.
                    </span>
                  </span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
