import Link from "next/link";
import { redirect } from "next/navigation";
import { Play } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSession, homePathFor } from "@/lib/auth/getSession";

// Illustrative rows for the preview panel — shaped like GET /api/lessons.
const previewLessons = [
  { title: "Intro to SQL Joins", instructor: "Jane Lee", category: "Data", minutes: 8, tint: "bg-sky-100 dark:bg-sky-950" },
  { title: "Designing a Settings Page", instructor: "Dara Sok", category: "Design", minutes: 12, tint: "bg-amber-100 dark:bg-amber-950" },
  { title: "Reading a Cash-Flow Statement", instructor: "Mina Chan", category: "Business", minutes: 10, tint: "bg-emerald-100 dark:bg-emerald-950" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? Skip the forms.
  const session = await getSession();
  if (session) redirect(homePathFor(session.profile.role));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/" className="w-fit">
          <Logo />
        </Link>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[360px]">{children}</div>
        </main>
      </div>

      <aside className="hidden border-l bg-muted/50 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          <p className="text-sm font-medium text-muted-foreground">Recently approved</p>

          <ul className="mt-4 divide-y rounded-xl border bg-background shadow-sm">
            {previewLessons.map((lesson) => (
              <li key={lesson.title} className="flex items-center gap-4 p-4">
                <div
                  className={`relative flex aspect-video w-24 shrink-0 items-center justify-center rounded-md ${lesson.tint}`}
                >
                  <Play className="size-4 text-foreground/70" fill="currentColor" strokeWidth={0} />
                  <span className="absolute right-1 bottom-1 rounded bg-foreground/80 px-1 py-px text-[10px] font-medium text-background tabular-nums">
                    {lesson.minutes}:00
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lesson.instructor} · {lesson.category}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-semibold tracking-tight text-balance">
            Short video lessons from people who do the work.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every lesson is reviewed before it&apos;s published. Watch for free, save what
            you want to come back to, or teach something you know.
          </p>
        </div>
      </aside>
    </div>
  );
}
