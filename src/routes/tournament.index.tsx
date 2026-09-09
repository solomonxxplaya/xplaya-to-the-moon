import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Swords, ListChecks, Radio, CalendarClock, Flame, History } from "lucide-react";
import { Screen, SectionHeading } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { games } from "@/lib/tournament/config";
import { useTournaments, byStatus } from "@/lib/tournament/service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tournament/")({
  head: () => ({
    meta: [
      { title: "Tournament — XPLAYA" },
      {
        name: "description",
        content:
          "Compete. Win. Climb. Discover official XPLAYA tournaments, find a match and track your competitions across Free Fire, CODM, PUBG Mobile and Blood Strike.",
      },
      { property: "og:title", content: "Tournament — XPLAYA" },
      {
        property: "og:description",
        content: "Official tournaments, matchmaking and competition tracking on XPLAYA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TournamentHub,
});

function EntryTile({
  to,
  icon: Icon,
  title,
  subtitle,
}: {
  to: string;
  icon: typeof Trophy;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="press surface-panel flex items-center gap-3 rounded-2xl p-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}

function TournamentHub() {
  const { data, loading } = useTournaments();
  const [game, setGame] = useState<string>("all");

  const filtered = useMemo(
    () => (game === "all" ? data : data.filter((t) => t.game === game)),
    [data, game],
  );

  const sections = [
    { key: "live", label: "Live Now", icon: Radio, rows: byStatus(filtered, "live") },
    { key: "upcoming", label: "Upcoming", icon: CalendarClock, rows: byStatus(filtered, "upcoming") },
    {
      key: "popular",
      label: "Popular",
      icon: Flame,
      rows: [...filtered].sort((a, b) => b.joined - a.joined).slice(0, 5),
    },
    { key: "recent", label: "Recent", icon: History, rows: filtered.slice(0, 5) },
  ];

  return (
    <Screen title="TOURNAMENT" subtitle="Compete. Win. Climb.">
      <div className="grid gap-2.5">
        <EntryTile
          to="/tournament/official"
          icon={Trophy}
          title="Official Tournaments"
          subtitle="Staff-run competitions with structure and verification"
        />
        <EntryTile
          to="/tournament/find-match"
          icon={Swords}
          title="Find a Match"
          subtitle="Pick game, mode, format, rules and level"
        />
        <EntryTile
          to="/tournament/my"
          icon={ListChecks}
          title="My Competitions"
          subtitle="Active entries, results and history"
        />
      </div>

      <div className="no-scrollbar -mx-5 mt-6 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {[{ id: "all", name: "All Games" }, ...games].map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={cn(
              "press shrink-0 rounded-full px-5 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase",
              game === g.id
                ? "bg-neon text-primary-foreground"
                : "border border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-7">
        {sections.map(({ key, label, icon: Icon, rows }) => (
          <section key={key}>
            <SectionHeading>{label}</SectionHeading>
            {loading ? (
              <div className="surface-panel h-24 animate-pulse rounded-3xl" />
            ) : rows.length ? (
              <div className="grid gap-3">
                {rows.map((t) => (
                  <TournamentCard key={`${key}-${t.id}`} tournament={t} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icon}
                title={`No ${label.toLowerCase()} competitions`}
                description="Nothing here is simulated. Real competitions appear the moment XPLAYA staff publish them."
              />
            )}
          </section>
        ))}
      </div>
    </Screen>
  );
}
