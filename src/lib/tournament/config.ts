/**
 * XPLAYA competitive system — shared tournament architecture.
 *
 * One architecture serves every supported game. A game only supplies its own
 * modes, formats, rules and competition levels; nothing about a game gets its
 * own tournament system.
 *
 * Supported games are intentionally fixed to four titles.
 */

export const supportedGameIds = ["free-fire", "cod-mobile", "pubg-mobile", "blood-strike"] as const;
export type GameId = (typeof supportedGameIds)[number];

/** Structure an official tournament can run with. */
export type TournamentStructure =
  | "bracket"
  | "league-points"
  | "battle-royale"
  | "group-stage"
  | "knockout"
  | "multi-round";

export const structureLabels: Record<TournamentStructure, string> = {
  bracket: "Bracket",
  "league-points": "League / Points",
  "battle-royale": "Battle Royale",
  "group-stage": "Group Stage",
  knockout: "Knockout",
  "multi-round": "Multi-Round",
};

/** Competition level — how serious the competition is. */
export const competitionLevels = ["Casual", "Ranked", "Pro", "Championship"] as const;
export type CompetitionLevel = (typeof competitionLevels)[number];

export interface GameConfig {
  id: GameId;
  name: string;
  short: string;
  /** Game modes (what you play). */
  modes: string[];
  /** Team formats (who you play with). Kept separate from modes. */
  formats: string[];
  /** Rule sets that can be applied to a competition. */
  rules: string[];
  /** Structures that make sense for this title. */
  structures: TournamentStructure[];
}

export const games: GameConfig[] = [
  {
    id: "free-fire",
    name: "Free Fire",
    short: "FF",
    modes: ["Battle Royale", "Clash Squad", "Lone Wolf"],
    formats: ["Solo", "Duo", "Squad", "1v1", "2v2", "4v4"],
    rules: ["Standard", "No Gloo Wall", "Headshot Only", "Limited Loadout", "Custom Room"],
    structures: ["battle-royale", "bracket", "knockout", "group-stage", "multi-round"],
  },
  {
    id: "cod-mobile",
    name: "Call of Duty Mobile",
    short: "CODM",
    modes: ["Multiplayer", "Battle Royale", "Search & Destroy", "Hardpoint", "Domination"],
    formats: ["Solo", "Duo", "Squad", "1v1", "2v2", "5v5"],
    rules: ["Standard", "Tournament Ruleset", "No Scorestreaks", "Weapon Restricted", "Custom Room"],
    structures: ["bracket", "knockout", "league-points", "battle-royale", "multi-round"],
  },
  {
    id: "pubg-mobile",
    name: "PUBG Mobile",
    short: "PUBGM",
    modes: ["Classic", "TDM", "Arena", "Payload"],
    formats: ["Solo", "Duo", "Squad", "1v1", "4v4"],
    rules: ["Standard", "No Vehicles", "TPP Only", "FPP Only", "Custom Room"],
    structures: ["battle-royale", "group-stage", "league-points", "bracket", "multi-round"],
  },
  {
    id: "blood-strike",
    name: "Blood Strike",
    short: "BS",
    modes: ["Battle Royale", "Team Deathmatch", "Squad Clash"],
    formats: ["Solo", "Duo", "Squad", "1v1", "3v3"],
    rules: ["Standard", "No Revive", "Weapon Restricted", "Custom Room"],
    structures: ["battle-royale", "bracket", "knockout", "multi-round"],
  },
];

export const gameById = (id: string | null | undefined): GameConfig | undefined =>
  games.find((g) => g.id === id);

/* --------------------------------- statuses -------------------------------- */

export type TournamentStatus = "upcoming" | "live" | "completed";

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  upcoming: "Upcoming",
  live: "Live Now",
  completed: "Completed",
};

/** Lifecycle of a single match inside any competition. */
export type MatchStatus =
  | "scheduled"
  | "ready"
  | "in-progress"
  | "awaiting-result"
  | "awaiting-confirmation"
  | "disputed"
  | "under-review"
  | "verified"
  | "cancelled";

export const matchStatusLabels: Record<MatchStatus, string> = {
  scheduled: "Scheduled",
  ready: "Ready",
  "in-progress": "In Progress",
  "awaiting-result": "Awaiting Result",
  "awaiting-confirmation": "Awaiting Confirmation",
  disputed: "Disputed",
  "under-review": "Under Review",
  verified: "Verified",
  cancelled: "Cancelled",
};

/* ---------------------------------- roles ---------------------------------- */

/**
 * Competitive roles map onto the existing profile role field
 * (users/{uid}.role) — no parallel permission system.
 */
export type CompetitiveRole =
  | "owner"
  | "staff"
  | "tournament-admin"
  | "match-moderator"
  | "player";

/** Only these profile roles may create or manage official tournaments. */
export const officialTournamentRoles = ["owner", "admin", "moderator"] as const;

/** True when the profile role may moderate/manage tournaments and matches. */
export const isTournamentStaff = (role: string | null | undefined): boolean =>
  Boolean(role && (officialTournamentRoles as readonly string[]).includes(role));

/* -------------------------------- placeholders ------------------------------ */

/** Payments are not connected yet — these are the only allowed placeholders. */
export const PRIZE_PLACEHOLDER = "PRIZE COMING SOON";
export const ENTRY_PLACEHOLDER = "ENTRY COMING SOON";
