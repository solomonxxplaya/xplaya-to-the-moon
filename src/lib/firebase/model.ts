import type { RankTier } from "@/lib/types";

/**
 * XPLAYA Firestore data model.
 *
 * Privacy architecture:
 *   users/{uid}                     -> PUBLIC profile (readable by anyone)
 *   users/{uid}/private/progression -> PRIVATE progression (owner + admin only)
 *
 * Exact XP, XP history and XP transactions live ONLY in the private
 * subcollection so another user can never read them, not even directly
 * through the Firestore SDK. Rank and level stay public because they are the
 * XPLAYA achievement/status system.
 */

export type UserRole = "user" | "moderator" | "admin" | "owner";

/** users/{uid} — public document. Contains no exact XP. */
export interface PublicProfileDoc {
  uid: string;
  username: string;
  /** Lowercased username used for prefix search. */
  usernameLower: string;
  displayName: string;
  bio: string;
  photoURL: string;
  /** Public achievement status. */
  rank: RankTier;
  level: number;
  role: UserRole;
  verified?: boolean;
  suspended?: boolean;
  createdAt?: unknown;
}

/** users/{uid}/private/progression — owner-readable only. */
export interface PrivateProgressionDoc {
  xp: number;
  xpToNextLevel: number;
  xpToday: number;
  xpSession: number;
  updatedAt?: unknown;
}

/** follows/{followerId}_{followingId} */
export interface FollowDoc {
  followerId: string;
  followingId: string;
  createdAt?: unknown;
}

/** likes/{userId}_{videoId} */
export interface LikeDoc {
  userId: string;
  videoId: string;
  /** Owner of the liked video — powers the profile "Like" total. */
  videoOwnerId: string;
  createdAt?: unknown;
}

/** comments/{commentId} */
export interface CommentDoc {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  photoURL: string;
  text: string;
  createdAt?: unknown;
}

/** videos/{videoId} */
export interface VideoDoc {
  id: string;
  ownerId: string;
  caption: string;
  hashtags: string[];
  game: string;
  posterUrl: string;
  videoUrl: string;
  createdAt?: unknown;
}

/** reports/{reportId} — admin-only reads. */
export interface ReportDoc {
  id: string;
  reporterId: string;
  targetType: "video" | "comment" | "user" | "conversation" | "group" | "message";
  targetId: string;
  reason: string;
  status: "open" | "reviewing" | "resolved";
  createdAt?: unknown;
}

export const followId = (followerId: string, followingId: string) =>
  `${followerId}_${followingId}`;

export const likeId = (userId: string, videoId: string) => `${userId}_${videoId}`;
