import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tagline = false,
}: {
  className?: string;
  tagline?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span
        className={cn(
          "display-title text-glow tracking-[0.14em] text-foreground",
          className,
        )}
      >
        XPLA<span className="text-neon">Y</span>A
      </span>
      {tagline ? (
        <span className="text-[10px] font-semibold tracking-[0.42em] text-muted-foreground uppercase">
          Watch. Play. Earn.
        </span>
      ) : null}
    </div>
  );
}
