import { Zap } from "lucide-react";
import { cn } from "cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md bg-foreground text-background",
        className
      )}
    >
      <Zap className="size-4" fill="currentColor" strokeWidth={0} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">Lightning Lessons</span>
    </span>
  );
}
