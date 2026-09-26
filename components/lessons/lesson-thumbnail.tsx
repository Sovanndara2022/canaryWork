import { Play } from "lucide-react";
import { cn } from "cn";
import { formatDuration } from "@/lib/format";

// Stable tint per category so lessons without a video still look intentional.
const tints = [
  "from-indigo-200 to-sky-100 dark:from-indigo-950 dark:to-sky-950",
  "from-amber-200 to-orange-100 dark:from-amber-950 dark:to-orange-950",
  "from-emerald-200 to-teal-100 dark:from-emerald-950 dark:to-teal-950",
  "from-violet-200 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950",
  "from-rose-200 to-pink-100 dark:from-rose-950 dark:to-pink-950",
];

function tintFor(key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tints[hash % tints.length];
}

export function LessonThumbnail({
  src,
  title,
  tintKey,
  durationSeconds,
  label,
  progress,
  className,
}: {
  src: string | null;
  title: string;
  tintKey: string;
  durationSeconds: number | null;
  /** Small chip in the top-left corner, e.g. the category. */
  label?: string | null;
  /** 0–100; draws a watch-progress bar along the bottom edge. */
  progress?: number | null;
  className?: string;
}) {
  const duration = formatDuration(durationSeconds);
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border/60",
        !src && ["bg-gradient-to-br", tintFor(tintKey)],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Mux thumbnails are already sized and cached by their CDN
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/70 shadow-sm dark:bg-black/40">
            <Play className="size-4 translate-x-px text-foreground/70" fill="currentColor" strokeWidth={0} />
          </span>
        </div>
      )}

      {label && (
        <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      )}
      {duration && (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
          {duration}
        </span>
      )}
      {progress != null && progress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30" aria-hidden="true">
          <div className="h-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  );
}
