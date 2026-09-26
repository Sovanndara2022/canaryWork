import { Play } from "lucide-react";
import { cn } from "cn";
import { formatDuration } from "@/lib/format";

// Stable tint per category so lessons without a video still look intentional.
const tints = [
  "bg-sky-100 dark:bg-sky-950",
  "bg-amber-100 dark:bg-amber-950",
  "bg-emerald-100 dark:bg-emerald-950",
  "bg-violet-100 dark:bg-violet-950",
  "bg-rose-100 dark:bg-rose-950",
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
  className,
}: {
  src: string | null;
  title: string;
  tintKey: string;
  durationSeconds: number | null;
  className?: string;
}) {
  const duration = formatDuration(durationSeconds);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-lg", !src && tintFor(tintKey), className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Mux thumbnails are already sized and cached by their CDN
        <img src={src} alt={title} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Play className="size-6 text-foreground/40" fill="currentColor" strokeWidth={0} />
        </div>
      )}
      {duration && (
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
          {duration}
        </span>
      )}
    </div>
  );
}
