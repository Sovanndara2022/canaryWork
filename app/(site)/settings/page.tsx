import Link from "next/link";
import { Presentation } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { becomeInstructorAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { requirePageRole } from "@/lib/auth/requireRole";

export const metadata = { title: "Settings · Lightning Lessons" };

const roleLabel = { student: "Student", instructor: "Instructor", admin: "Admin" } as const;

export default async function SettingsPage() {
  const { profile } = await requirePageRole();

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" description="How you appear to others on Lightning Lessons." />

      <div className="mt-8 rounded-xl border bg-card shadow-xs p-5 sm:p-6">
        <ProfileForm initial={profile} />
      </div>

      <div className="mt-6 rounded-xl border bg-card shadow-xs p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Account</h2>
        <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate">{profile.email}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd>{roleLabel[profile.role]}</dd>
        </dl>

        {profile.role === "student" ? (
          <form action={becomeInstructorAction} className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Want to publish your own lessons?</p>
            <Button type="submit" variant="outline" className="h-9 px-4">
              <Presentation /> Start teaching
            </Button>
          </form>
        ) : (
          <p className="mt-5 border-t pt-5 text-sm text-muted-foreground">
            Manage your lessons from <Link href="/instructor" className="font-medium text-foreground underline underline-offset-4">Teach</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
