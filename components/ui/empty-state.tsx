import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/40 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
