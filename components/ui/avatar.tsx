import { cn } from "cn";
import { initials } from "@/lib/format";

export function Avatar({ name, src, className }: { name: string | null | undefined; src?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary avatar hosts (Google etc.)
        <img src={src} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
