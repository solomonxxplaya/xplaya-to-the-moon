import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { RankBadge, RankCrest } from "@/components/xplaya/RankBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  formatRank,
  nextRank,
  rankAccent,
  rankArt,
  rankIndex,
  rankLadder,
  splitRank,
} from "@/lib/ranks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rank")({
  head: () => ({
    meta: [
      { title: "Rank Board — XPLAYA" },
      {
        name: "description",
        content:
          "The XPLAYA rank ladder: Bronze to Legend, your current rank, level and progress toward the next rank.",
      },
      { property: "og:title", content: "Rank Board — XPLAYA" },
      {
        property: "og:description",
        content: "Climb from Bronze to Legend and track your rank progress on XPLAYA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RankView,
});

function RankView() {
  const { user, isAuthenticated } = useAuth();
  const rank = user?.rank ?? null;
  const upcoming = rank ? nextRank(rank) : null;
  const xp = user?.xp ?? 0;
  const xpToNext = user?.xpToNextLevel ?? 0;
  const percent = xpToNext > 0 ? Math.min(Math.round((xp / xpToNext) * 100), 100) : 0;
  const remaining = Math.max(xpToNext - xp, 0);
  const current = rank ? splitRank(rank) : null;
  const currentIdx = rank ? rankIndex(rank) : -1;

  return (
    <Screen title="Rank Board" subtitle="Bronze to Legend">
      {rank && current ? (
        <section className="relative overflow-hidden rounded-[32px] border border-border bg-surface/70 p-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-48"
            style={{
              background: `radial-gradient(circle at 50% -20%, ${rankAccent[current.tier]}33, transparent 70%)`,
            }}
          />
          <div className="relative grid place-items-center">
            <RankCrest rank={rank} size="xl" showLevel={false} />
            <p className="display-title mt-3 text-[30px] leading-none text-foreground">
              {current.tier}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-neon uppercase">
                {current.level ? `Level ${current.level}` : "Single rank"}
              </span>
              <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-foreground/80 uppercase">
                XP level {user?.level ?? 1}
              </span>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.16em] uppercase">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground/80 tabular-nums">{percent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, ${rankAccent[current.tier]}, var(--color-neon, #a3ff4f))`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {xp.toLocaleString()} XP
                {xpToNext > 0 ? ` · ${remaining.toLocaleString()} XP to go` : ""}
              </p>
              {upcoming ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                    Next
                  </span>
                  <RankBadge rank={upcoming} size="sm" />
                </div>
              ) : (
                <span className="text-[10px] font-bold tracking-[0.16em] text-neon uppercase">
                  Top of the ladder
                </span>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="surface-panel grid gap-3 rounded-[32px] p-5 text-center">
          <RankCrest rank="Bronze I" size="lg" className="mx-auto" showLevel={false} />
          <p className="text-sm font-bold">
            {isAuthenticated ? "Your rank is loading" : "Sign in to see your rank"}
          </p>
          <p className="mx-auto max-w-[36ch] text-xs text-muted-foreground">
            Every XPLAYA player starts at Bronze I and climbs the ladder to Legend by earning XP.
          </p>
          {!isAuthenticated ? (
            <Button asChild className="mx-auto mt-1 h-11 rounded-full px-6 font-semibold">
              <Link to="/login">Log in</Link>
            </Button>
          ) : null}
        </section>
      )}

      {/* Full progression ladder */}
      <section className="mt-4">
        <h2 className="mb-3 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
          Full progression
        </h2>
        <ol className="space-y-2">
          {rankLadder.map((group) => {
            const groupActive = current?.tier === group.tier;
            const accent = rankAccent[group.tier];
            return (
              <li
                key={group.tier}
                className={cn(
                  "overflow-hidden rounded-3xl border bg-surface/60 p-4",
                  groupActive ? "border-neon/50" : "border-border",
                )}
                style={
                  groupActive
                    ? { boxShadow: `inset 0 0 40px -20px ${accent}` }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <img
                    src={rankArt[group.tier]}
                    alt={`${group.tier} rank artwork`}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="display-title truncate text-[20px] leading-none"
                      style={{ color: accent }}
                    >
                      {group.tier}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {group.ranks.length > 1 ? "Levels I – V" : "Single rank"}
                    </p>
                  </div>
                  {groupActive ? (
                    <span className="shrink-0 rounded-full bg-neon/15 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-neon uppercase">
                      You
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.ranks.map((r) => {
                    const idx = rankIndex(r);
                    const reached = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <span
                        key={r}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase",
                          isCurrent
                            ? "border-neon bg-neon/15 text-neon"
                            : reached
                              ? "border-border bg-surface-2 text-foreground/80"
                              : "border-border/60 bg-transparent text-muted-foreground",
                        )}
                      >
                        {group.ranks.length > 1 ? splitRank(r).level : formatRank(r)}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          Bronze <ChevronRight className="h-3 w-3" /> Legend
        </p>
      </section>
    </Screen>
  );
}
