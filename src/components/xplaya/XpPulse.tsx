import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

/**
 * Compact live progression indicator for the home feed: level shard, segmented
 * energy cells for current XP and the XP gained recently. Deliberately small so
 * it never blocks the video.
 */
export function XpPulse({ profile, className }: { profile: UserProfile; className?: string }) {
  const percent = Math.min(Math.round((profile.xp / profile.xpToNextLevel) * 100), 100);
  const cells = 10;
  const filled = Math.round((percent / 100) * cells);
  const recent = profile.xpToday ?? 0;

  return (
    <div
      className={cn(
        "pointer-events-auto inline-flex items-center gap-2 rounded-full border border-neon/30 bg-black/55 py-[3px] pr-3 pl-[3px] backdrop-blur-md",
        className,
      )}
    >
      {/* level shard */}
      <span
        className="relative grid h-[22px] w-[20px] shrink-0 place-items-center bg-gradient-to-br from-neon via-neon to-neon/50"
        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
      >
        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_45%)]" />
        <span className="relative text-[10px] font-black text-primary-foreground">
          {profile.level}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[10px] w-[3px] skew-x-[-20deg] rounded-[1px]",
              i < filled ? "bg-neon shadow-[0_0_6px_rgba(163,255,79,0.6)]" : "bg-white/18",
            )}
          />
        ))}
      </span>

      <span className="text-[10px] font-bold tracking-[0.08em] text-foreground tabular-nums">
        {profile.xp.toLocaleString()} XP
      </span>
      {recent > 0 ? (
        <span className="text-[10px] font-bold text-neon tabular-nums">
          +{recent.toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}
