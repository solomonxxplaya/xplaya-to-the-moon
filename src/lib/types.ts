export const rankTierNames = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Hero",
  "Elite Hero",
  "Master",
  "Grandmaster",
  "Legend",
] as const;

export type RankTierName = (typeof rankTierNames)[number];
export type RankLevel = "I" | "II" | "III" | "IV" | "V";
export type RankTier = RankTierName | `${RankTierName} ${RankLevel}`;

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified?: boolean;
  rank?: RankTier;
}

export interface VideoPost {
  id: string;
  creator: Creator;
  caption: string;
  hashtags: string[];
  audio: string;
  posterUrl: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
  game: string;
}

export type TournamentStatus = "upcoming" | "live" | "completed";

export interface Tournament {
  id: string;
  title: string;
  game: string;
  prize: string;
  entry: string;
  players: number;
  capacity: number;
  status: TournamentStatus;
  startsIn: string;
  coverUrl: string;
}

export interface LiveStream {
  id: string;
  title: string;
  creator: Creator;
  category: string;
  viewers: number;
  thumbnailUrl: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  badge?: string;
}

export type ActivityType = "like" | "comment" | "follow" | "mention" | "system";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor?: Creator;
  text: string;
  time: string;
  thumbnailUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  xp: number;
  xpToNextLevel: number;
  level: number;
  rank: RankTier;
  followers: number;
  following: number;
  posts: number;
  /** XP earned in the last 24h — drives the live progression chip. */
  xpToday?: number;
  /** XP earned in the current session. */
  xpSession?: number;
}
