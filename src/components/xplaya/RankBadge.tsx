import { cn } from "@/lib/utils";
import type { RankTier } from "@/lib/types";
import { formatRank, rankAccent, rankArt, splitRank } from "@/lib/ranks";

export { splitRank, nextRank } from "@/lib/ranks";

const sizes = {
  sm: { box: "h-6 gap-1.5 pr-2.5 pl-1 text-[10px]", mark: "h-5 w-5" },
  md: { box: "h-8 gap-2 pr-3.5 pl-1.5 text-[11px]", mark: "h-6 w-6" },
  lg: { box: "h-11 gap-2.5 pr-5 pl-2 text-sm", mark: "h-8 w-8" },
} as const;

/**
 * Compact XPLAYA rank plate: the tier artwork plus the tier name and roman
 * level (I–V). Artwork is always shown complete — contained, never cropped.
 */
export function RankBadge({
  rank,
  className,
  size = "md",
}: {
  rank: RankTier;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { tier, level } = splitRank(rank);
  const accent = rankAccent[tier];
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-full p-[1px]",
        className,
      )}
      style={{
        background: `linear-gradient(100deg, ${accent}55, ${accent}, ${accent}55)`,
        boxShadow: `0 0 18px -8px ${accent}`,
      }}
    >
      <span
        className={cn(
          "inline-flex w-full items-center rounded-full bg-gradient-to-b from-black/85 to-black font-bold tracking-[0.14em] uppercase",
          s.box,
        )}
        style={{ color: accent }}
      >
        <img
          src={rankArt[tier]}
          alt=""
          aria-hidden
          loading="lazy"
          className={cn("shrink-0 object-contain", s.mark)}
        />
        <span className="truncate">{tier}</span>
        {level ? (
          <span className="ml-auto shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[0.85em] leading-none tracking-normal">
            {level}
          </span>
        ) : null}
      </span>
    </span>
  );
}

const crestSizes = {
  sm: { wrap: "h-20 w-20", level: "text-[10px]" },
  md: { wrap: "h-28 w-28", level: "text-[11px]" },
  lg: { wrap: "h-36 w-36", level: "text-[13px]" },
  xl: { wrap: "h-52 w-52", level: "text-sm" },
} as const;

/**
 * Large rank crest: the complete XPLAYA rank artwork with an accent aura and
 * the roman level underneath. Aspect ratio is preserved at every size.
 */
export function RankCrest({
  rank,
  size = "lg",
  showLevel = true,
  className,
}: {
  rank: RankTier;
  size?: keyof typeof crestSizes;
  showLevel?: boolean;
  className?: string;
}) {
  const { tier, level } = splitRank(rank);
  const accent = rankAccent[tier];
  const s = crestSizes[size];

  return (
    <div className={cn("relative grid place-items-center", className)}>
      <div
        aria-hidden
        className="absolute h-3/4 w-3/4 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)` }}
      />
      <img
        src={rankArt[tier]}
        alt={`${formatRank(rank)} rank artwork`}
        className={cn("relative h-full w-full object-contain", s.wrap)}
      />
      {showLevel && level ? (
        <span
          className={cn(
            "absolute -bottom-1 rounded-full border bg-black/75 px-2 py-0.5 font-bold tracking-[0.18em]",
            s.level,
          )}
          style={{ color: accent, borderColor: `${accent}66` }}
        >
          {level}
        </span>
      ) : null}
    </div>
  );
}
