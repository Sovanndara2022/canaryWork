import type { LucideIcon } from "lucide-react";

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon?: LucideIcon }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
