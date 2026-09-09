import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Trophy, ShieldCheck } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { useAuth } from "@/lib/auth-context";
import {
  competitionLevels,
  gameById,
  games,
  tournamentStatusLabels,
  officialTournamentRoles,
} from "@/lib/tournament/config";
import { useTournaments } from "@/lib/tournament/service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tournament/official")({
  head: () => ({
    meta: [
      { title: "Official Tournaments — XPLAYA" },
      {
        name: "description",
        content:
          "Browse official XPLAYA tournaments by game, mode, format, rules, level and status.",
      },
      { property: "og:title", content: "Official Tournaments — XPLAYA" },
      {
        property: "og:description",
        content: "Official, staff-run competitions across the four supported XPLAYA titles.",
      },
    ],
  }),
  component: OfficialTournaments,
});

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="block text-[9px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full truncate rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function OfficialTournaments() {
  const { data, loading } = useTournaments();
  const { role } = useAuth();
  const canManage = officialTournamentRoles.includes(
    (role ?? "player") as (typeof officialTournamentRoles)[number],
  );

  const [game, setGame] = useState("all");
  const [mode, setMode] = useState("all");
  const [format, setFormat] = useState("all");
  const [rule, setRule] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [term, setTerm] = useState("");

  const cfg = gameById(game);

  const rows = useMemo(
    () =>
      data.filter(
        (t) =>
          (game === "all" || t.game === game) &&
          (mode === "all" || t.mode === mode) &&
          (format === "all" || t.format === format) &&
          (rule === "all" || t.rule === rule) &&
          (level === "all" || t.level === level) &&
          (status === "all" || t.status === status) &&
          (!term.trim() || t.title.toLowerCase().includes(term.trim().toLowerCase())),
      ),
    [data, game, mode, format, rule, level, status, term],
  );

  return (
    <Screen title="Official" subtitle="Staff-run competitions">
      <Link
        to="/tournament"
        className="press mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tournament hub
      </Link>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search tournaments"
          className="w-full rounded-2xl border border-border bg-surface py-2.5 pr-3 pl-9 text-sm"
        />
      </div>

      <div className="no-scrollbar -mx-5 mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {[{ id: "all", name: "All Games" }, ...games].map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setGame(g.id);
              setMode("all");
              setFormat("all");
              setRule("all");
            }}
            className={cn(
              "press shrink-0 rounded-full px-5 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase",
              game === g.id
                ? "bg-neon text-primary-foreground"
                : "border border-border bg-surface text-muted-foreground",
            )}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Select label="Mode" value={mode} options={cfg?.modes ?? []} onChange={setMode} />
        <Select label="Format" value={format} options={cfg?.formats ?? []} onChange={setFormat} />
        <Select label="Rules" value={rule} options={cfg?.rules ?? []} onChange={setRule} />
        <Select label="Level" value={level} options={[...competitionLevels]} onChange={setLevel} />
        <Select
          label="Status"
          value={status}
          options={Object.keys(tournamentStatusLabels)}
          onChange={setStatus}
        />
      </div>

      {canManage ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-neon/40 bg-neon/5 px-4 py-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-neon" />
          <p className="text-[11px] leading-relaxed text-foreground/85">
            You have staff permissions. Official tournament creation tools are being wired to the
            competition database next.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="surface-panel h-24 animate-pulse rounded-3xl" />
        ) : rows.length ? (
          rows.map((t) => <TournamentCard key={t.id} tournament={t} />)
        ) : (
          <EmptyState
            icon={Trophy}
            title="No official tournaments match"
            description="Only XPLAYA staff can publish official tournaments, and none match these filters yet."
          />
        )}
      </div>
    </Screen>
  );
}
