import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LessonThumbnail } from "@/components/lessons/lesson-thumbnail";
import { getSession, getSupabase, homePathFor } from "@/lib/auth/getSession";
import { listCatalog } from "@/lib/data/lessons";

// Shown until real lessons are published.
const sampleLessons = [
  { id: "sample-data", title: "Intro to SQL Joins", byline: "Jane Lee · Data", seconds: 480, tint: "data" },
  { id: "sample-design", title: "Designing a Settings Page", byline: "Dara Sok · Design", seconds: 720, tint: "design" },
  { id: "sample-business", title: "Reading a Cash-Flow Statement", byline: "Mina Chan · Business", seconds: 600, tint: "business" },
];

async function recentLessons() {
  try {
    const { rows } = await listCatalog(await getSupabase(), { sort: "newest", from: 0, to: 2 });
    if (rows.length === 0) return { label: "Lessons like these", items: sampleLessons.map((l) => ({ ...l, thumbnail: null })) };
    return {
      label: "Recently published",
      items: rows.map((l) => ({
        id: l.id,
        title: l.title,
        byline: [l.instructor?.full_name, l.category?.name].filter(Boolean).join(" · "),
        seconds: l.duration_seconds,
        tint: l.category?.slug ?? l.id,
        thumbnail: l.thumbnail_url,
      })),
    };
  } catch {
    return { label: "Lessons like these", items: sampleLessons.map((l) => ({ ...l, thumbnail: null })) };
  }
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? Skip the forms.
  const session = await getSession();
  if (session) redirect(homePathFor(session.profile.role));
  const preview = await recentLessons();

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
          <p className="text-sm font-medium text-muted-foreground">{preview.label}</p>

          <ul className="mt-4 divide-y rounded-xl border bg-background shadow-sm">
            {preview.items.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-4 p-4">
                <LessonThumbnail
                  src={lesson.thumbnail}
                  title={lesson.title}
                  tintKey={lesson.tint}
                  durationSeconds={lesson.seconds}
                  className="w-24 shrink-0 rounded-md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{lesson.byline}</p>
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
