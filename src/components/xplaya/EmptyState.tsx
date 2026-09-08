import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-panel grid place-items-center gap-2 rounded-3xl px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="max-w-[38ch] text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ComingSoonState({
  icon: Icon,
  title = "Coming soon",
  description = "This XPLAYA feature is currently being prepared.",
}: {
  icon: LucideIcon;
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={Icon} title={title} description={description} />;
}
