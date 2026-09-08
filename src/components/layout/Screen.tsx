import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard screen wrapper: mobile-first column, capped for desktop preview,
 * with space reserved for the fixed bottom navigation.
 */
export function Screen({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-lg pb-28">
      {title ? (
        <header className="safe-top sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border bg-background/80 px-5 pt-5 pb-4 backdrop-blur-xl">
          <div className="min-w-0">
            <h1 className="display-title truncate text-[30px] text-foreground">{title}</h1>
            {subtitle ? (
              <p className="mt-1 truncate text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 pt-5", className)}>{children}</div>
    </div>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "press shrink-0 rounded-full px-5 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase",
            value === option
              ? "bg-neon text-primary-foreground"
              : "border border-border bg-surface text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ComingSoonNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** Prominent, unmissable "coming soon" banner shown above a previewed screen. */
export function ComingSoonBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-4 rounded-3xl border-2 border-neon/60 bg-neon/10 px-5 py-5 text-center">
      <p className="display-title text-[26px] tracking-[0.16em] text-neon">Coming soon</p>
      {children ? (
        <p className="mt-1 text-xs leading-relaxed text-foreground/80">{children}</p>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {children}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
