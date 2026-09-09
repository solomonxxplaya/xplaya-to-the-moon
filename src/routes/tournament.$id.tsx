import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ArrowLeft, ShieldAlert, Swords, Trophy, Users, Zap, Loader2 } from "lucide-react";
import { Screen, SectionHeading } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { StatusPill } from "@/components/tournament/TournamentCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  ENTRY_PLACEHOLDER,
  PRIZE_PLACEHOLDER,
  gameById,
  matchStatusLabels,
  structureLabels,
} from "@/lib/tournament/config";
import {
  getTournament,
  joinTournament,
  listTournamentEntries,
  listTournamentMatches,
  useAsync,
} from "@/lib/tournament/service";
import type { MatchDoc, TournamentDoc, TournamentEntryDoc } from "@/lib/tournament/model";
import { toast } from "sonner";

export const Route = createFileRoute("/tournament/$id")({
  head: () => ({
    meta: [
      { title: "Tournament — XPLAYA" },
      {
        name: "description",
        content: "Structure, rules, slots, matches and results for this XPLAYA tournament.",
      },
      { property: "og:title", content: "Tournament — XPLAYA" },
      {
        property: "og:description",
        content: "Structure, rules, slots and verified match results on XPLAYA.",
      },
    ],
  }),
  component: TournamentDetail,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="truncate text-sm font-semibold">{value}</span>
    </div>
  );
}

function TournamentDetail() {
  const { id } = useParams({ from: "/tournament/$id" });
  const { uid, requireAuth } = useAuth();

  const loadTournament = useCallback(() => getTournament(id), [id]);
  const loadEntries = useCallback(() => listTournamentEntries(id), [id]);
  const loadMatches = useCallback(() => listTournamentMatches(id), [id]);

  const { data: tournament, loading } = useAsync<TournamentDoc | null>(loadTournament, [id], null);
  const { data: entries, refresh } = useAsync<TournamentEntryDoc[]>(loadEntries, [id], []);
  const { data: matches } = useAsync<MatchDoc[]>(loadMatches, [id], []);
  const [joining, setJoining] = useState(false);

  if (loading) {
    return (
      <div className="grid h-[70svh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 pt-16 pb-24">
        <EmptyState
          icon={ShieldAlert}
          title="Tournament not found"
          description="This competition no longer exists, or it has not been published by XPLAYA staff."
          action={
            <Button asChild variant="outline" className="rounded-full border-border bg-transparent">
              <Link to="/tournament/official">Back to tournaments</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const game = gameById(tournament.game);
  const myEntry = entries.find((e) => e.userId === uid && e.status !== "withdrawn");
  const full = entries.length >= tournament.slots;

  const join = async () => {
    if (!requireAuth("join this tournament")) return;
    if (!uid) return;
    setJoining(true);
    try {
      await joinTournament(tournament.id, uid);
      toast.success("You're registered. Check-in opens before the first match.");
      refresh();
    } catch {
      toast.error("Could not register you for this tournament.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen title={tournament.title} subtitle={`${game?.name ?? tournament.game} · ${tournament.level}`}>
      <Link
        to="/tournament/official"
        className="press mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Official tournaments
      </Link>

      <div className="surface-panel rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status={tournament.status} />
          {tournament.freeTrial ? (
            <span className="rounded-full border border-neon/60 bg-neon/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] text-neon uppercase">
              Free trial
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <Row label="Game" value={game?.name ?? tournament.game} />
          <Row label="Mode" value={tournament.mode} />
          <Row label="Format" value={tournament.format} />
          <Row label="Rules" value={tournament.rule} />
          <Row label="Structure" value={structureLabels[tournament.structure]} />
          <Row label="Level" value={tournament.level} />
          <Row label="Slots" value={`${entries.length}/${tournament.slots}`} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-surface px-3 py-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              <Trophy className="h-3 w-3" /> Prize
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold">
              {tournament.prize ?? PRIZE_PLACEHOLDER}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-3 py-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              <Zap className="h-3 w-3" /> Entry
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold">
              {tournament.freeTrial ? "FREE TRIAL" : (tournament.entry ?? ENTRY_PLACEHOLDER)}
            </p>
          </div>
        </div>

        {myEntry ? (
          <p className="mt-4 rounded-2xl border border-neon/40 bg-neon/5 px-4 py-3 text-center text-xs font-semibold text-neon">
            You are registered · {myEntry.status}
          </p>
        ) : (
          <Button
            className="mt-4 w-full rounded-full"
            disabled={joining || full || tournament.status === "completed"}
            onClick={() => void join()}
          >
            {full
              ? "Slots full"
              : tournament.status === "completed"
                ? "Competition finished"
                : joining
                  ? "Registering…"
                  : "Join competition"}
          </Button>
        )}
      </div>

      <section className="mt-7">
        <SectionHeading>Matches</SectionHeading>
        {matches.length ? (
          <div className="grid gap-2.5">
            {matches.map((m) => (
              <Link
                key={m.id}
                to="/match/$id"
                params={{ id: m.id }}
                className="press surface-panel flex items-center gap-3 rounded-2xl px-4 py-3"
              >
                <Swords className="h-4 w-4 shrink-0 text-neon" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {m.round ? `Round ${m.round}` : "Match"} · {m.format}
                  </p>
                  <p className="truncate text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {matchStatusLabels[m.status]}
                  </p>
                </div>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{m.participantIds.length}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Swords}
            title="No matches scheduled yet"
            description="Match-ups appear here once staff draw this competition's structure."
          />
        )}
      </section>
    </Screen>
  );
}
