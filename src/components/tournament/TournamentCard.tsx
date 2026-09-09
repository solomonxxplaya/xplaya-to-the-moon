import { Link } from "@tanstack/react-router";
import { Users, Zap } from "lucide-react";
import {
  ENTRY_PLACEHOLDER,
  PRIZE_PLACEHOLDER,
  gameById,
  structureLabels,
  tournamentStatusLabels,
} from "@/lib/tournament/config";
import type { TournamentDoc } from "@/lib/tournament/model";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: TournamentDoc["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] uppercase",
        status === "live"
          ? "bg-neon text-primary-foreground"
          : status === "upcoming"
            ? "border border-border bg-surface text-foreground"
            : "border border-border bg-surface text-muted-foreground",
      )}
    >
      {tournamentStatusLabels[status]}
    </span>
  );
}

export function TournamentCard({ tournament }: { tournament: TournamentDoc }) {
  const game = gameById(tournament.game);
  return (
    <Link
      to="/tournament/$id"
      params={{ id: tournament.id }}
      className="press surface-panel block rounded-3xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display-title truncate text-[19px] leading-tight">{tournament.title}</p>
          <p className="mt-1 truncate text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {game?.name ?? tournament.game} · {tournament.mode} · {tournament.format}
          </p>
        </div>
        <StatusPill status={tournament.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>{tournament.level}</Chip>
        <Chip>{structureLabels[tournament.structure]}</Chip>
        <Chip>{tournament.rule}</Chip>
        {tournament.freeTrial ? <Chip highlight>Free trial</Chip> : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Meta icon={Zap} label="Prize" value={tournament.prize ?? PRIZE_PLACEHOLDER} />
        <Meta icon={Zap} label="Entry" value={tournament.entry ?? ENTRY_PLACEHOLDER} />
        <Meta
          icon={Users}
          label="Slots"
          value={`${tournament.joined}/${tournament.slots}`}
        />
      </div>
    </Link>
  );
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] uppercase",
        highlight
          ? "border-neon/60 bg-neon/10 text-neon"
          : "border-border bg-surface text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold">{value}</p>
    </div>
  );
}
