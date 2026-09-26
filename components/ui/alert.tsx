import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

const tones = {
  info: "border-border bg-muted/50",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  danger: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
};

export function Alert({
  tone = "info",
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("flex gap-3 rounded-xl border p-4 text-sm", tones[tone], className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children && <div className="mt-1 opacity-80">{children}</div>}
      </div>
    </div>
  );
}
