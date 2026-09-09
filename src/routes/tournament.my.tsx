import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ListChecks, History, ShieldQuestion } from "lucide-react";
import { Screen, SectionHeading } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useMyEntries, useTournaments } from "@/lib/tournament/service";
import { TournamentCard } from "@/components/tournament/TournamentCard";

export const Route = createFileRoute("/tournament/my")({
  head: () => ({
    meta: [
      { title: "My Competitions — XPLAYA" },
      {
        name: "description",
        content: "Track your active XPLAYA competitions, match results and competition history.",
      },
      { property: "og:title", content: "My Competitions — XPLAYA" },
      {
        property: "og:description",
        content: "Your active entries, submitted results and competition history on XPLAYA.",
      },
    ],
  }),
  component: MyCompetitions,
});

function MyCompetitions() {
  const { uid, isAuthenticated } = useAuth();
  const { data: entries, loading } = useMyEntries(uid ?? null);
  const { data: tournaments } = useTournaments();

  const active = entries.filter((e) => e.status === "registered" || e.status === "checked-in");
  const past = entries.filter((e) => !active.includes(e));
  const find = (id: string) => tournaments.find((t) => t.id === id);

  return (
    <Screen title="My Competitions" subtitle="Entries · Results · History">
      <Link
        to="/tournament"
        className="press mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tournament hub
      </Link>

      {!isAuthenticated ? (
        <EmptyState
          icon={ShieldQuestion}
          title="Sign in to track competitions"
          description="Your entries, submitted results and verification status appear here once you're signed in."
        />
      ) : (
        <div className="grid gap-7">
          <section>
            <SectionHeading>Active</SectionHeading>
            {loading ? (
              <div className="surface-panel h-24 animate-pulse rounded-3xl" />
            ) : active.length ? (
              <div className="grid gap-3">
                {active.map((e) => {
                  const t = find(e.tournamentId);
                  return t ? <TournamentCard key={e.id} tournament={t} /> : null;
                })}
              </div>
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No active competitions"
                description="Join an official tournament or queue a match to see it here."
              />
            )}
          </section>

          <section>
            <SectionHeading>History</SectionHeading>
            {past.length ? (
              <div className="grid gap-3">
                {past.map((e) => {
                  const t = find(e.tournamentId);
                  return t ? <TournamentCard key={e.id} tournament={t} /> : null;
                })}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No competition history yet"
                description="Completed matches, verified results and placements will be listed here."
              />
            )}
          </section>
        </div>
      )}
    </Screen>
  );
}
