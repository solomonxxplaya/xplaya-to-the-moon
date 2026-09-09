/**
 * Firestore data model for the XPLAYA competitive system.
 *
 * Collections:
 *   tournaments/{id}                  -> official tournaments (staff-created)
 *   tournamentEntries/{id}            -> a player's participation record
 *   matches/{id}                      -> a single match in any competition
 *   matchResults/{id}                 -> submitted results + evidence
 *   matchRequests/{id}                -> Find a Match requests (matchmaking)
 *
 * Nothing here is seeded with fake data — empty collections render honest
 * empty states in the UI.
 */
import type {
  CompetitionLevel,
  GameId,
  MatchStatus,
  TournamentStatus,
  TournamentStructure,
} from "./config";

export interface TournamentDoc {
  id: string;
  title: string;
  game: GameId;
  mode: string;
  format: string;
  rule: string;
  level: CompetitionLevel;
  structure: TournamentStructure;
  status: TournamentStatus;
  /** Free trial competitions carry no entry requirement at all. */
  freeTrial: boolean;
  /** Prize/entry values stay null until payments are connected. */
  prize: string | null;
  entry: string | null;
  slots: number;
  joined: number;
  bannerUrl?: string;
  createdBy: string;
  startsAt?: number;
  createdAt?: unknown;
}

export interface TournamentEntryDoc {
  id: string;
  tournamentId: string;
  userId: string;
  teamName?: string;
  status: "registered" | "checked-in" | "eliminated" | "completed" | "withdrawn";
  createdAt?: unknown;
}

export interface MatchDoc {
  id: string;
  /** Null for casual Find-a-Match games outside an official tournament. */
  tournamentId: string | null;
  game: GameId;
  mode: string;
  format: string;
  rule: string;
  level: CompetitionLevel;
  round?: number;
  participantIds: string[];
  status: MatchStatus;
  scheduledAt?: number;
  createdAt?: unknown;
}

/** A player's claimed outcome. Never trusted until confirmed or verified. */
export interface MatchResultDoc {
  id: string;
  matchId: string;
  submittedBy: string;
  outcome: "win" | "loss";
  /** Battle-royale style scoring, when the structure needs it. */
  placement?: number;
  kills?: number;
  /** Screenshot evidence stored in Cloudflare R2. */
  evidenceUrls: string[];
  note?: string;
  confirmedBy?: string[];
  disputedBy?: string[];
  /** Set only by a match moderator / tournament admin. */
  verifiedBy?: string;
  createdAt?: unknown;
}

export interface MatchRequestDoc {
  id: string;
  userId: string;
  game: GameId;
  mode: string;
  format: string;
  rule: string;
  level: CompetitionLevel;
  status: "open" | "matched" | "cancelled" | "expired";
  createdAt?: unknown;
}
