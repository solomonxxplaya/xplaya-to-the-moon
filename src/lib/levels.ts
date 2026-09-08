/**
 * XPLAYA LEVEL SYSTEM — independent long-term account progression.
 *
 * This layer is deliberately SEPARATE from:
 *   • XP   — the rank progression currency (see the private progression doc)
 *   • Rank — the Bronze → Legend status ladder (see `src/lib/ranks.ts`)
 *
 * Nothing in this file reads, writes or changes XP or Rank. Level is derived
 * from real, verifiable account activity already stored in Firestore
 * (uploads, likes received, followers, comments received, views), so it can
 * never drift and cannot be tampered with by a client.
 *
 * Progression is formula-driven and unbounded: there is no maximum level and
 * no hardcoded table, so Level 51, 100, 200, 500+ all work without changes.
 *
 * Curve: cost(n) = 60 · n^1.35 · 1.075^n   (points to go from level n → n+1)
 *   Lv 1–10   easy      (~11k cumulative)
 *   Lv 10–20  moderate  (~92k cumulative)
 *   Lv 21–30  hard      (~409k cumulative)
 *   Lv 31–50  very hard (~4.3M cumulative — years of sustained activity)
 *   Lv 51+    keeps compounding, becoming progressively rarer.
 */

/** Weight of each real activity signal, in Level Points (LP). */
export const activityWeights = {
  upload: 100,
  follower: 25,
  likeReceived: 5,
  commentReceived: 8,
  following: 2,
  view: 1,
} as const;

export interface ActivityStats {
  uploads?: number;
  followers?: number;
  following?: number;
  likesReceived?: number;
  commentsReceived?: number;
  views?: number;
}

/** Total Level Points earned by an account from its real activity. */
export function activityPoints(stats: ActivityStats): number {
  return Math.max(
    0,
    Math.round(
      (stats.uploads ?? 0) * activityWeights.upload +
        (stats.followers ?? 0) * activityWeights.follower +
        (stats.likesReceived ?? 0) * activityWeights.likeReceived +
        (stats.commentsReceived ?? 0) * activityWeights.commentReceived +
        (stats.following ?? 0) * activityWeights.following +
        (stats.views ?? 0) * activityWeights.view,
    ),
  );
}

/** Points required to advance from `level` to `level + 1`. Never capped. */
export function pointsForNextLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return Math.round(60 * Math.pow(n, 1.35) * Math.pow(1.075, n));
}

/** Cumulative points required to reach `level` (level 1 costs nothing). */
export function totalPointsForLevel(level: number): number {
  let total = 0;
  for (let n = 1; n < Math.max(1, Math.floor(level)); n += 1) {
    total += pointsForNextLevel(n);
  }
  return total;
}

export interface LevelProgress {
  level: number;
  /** Total lifetime Level Points. */
  points: number;
  /** Points earned inside the current level. */
  intoLevel: number;
  /** Points needed to complete the current level. */
  levelSpan: number;
  /** Points still required for the next level. */
  remaining: number;
  /** 0–100 progress through the current level. */
  percent: number;
}

/**
 * Resolves a level from lifetime points by walking the curve. The loop is
 * O(level), which stays trivial even at level 1000+, and needs no table.
 */
export function levelFromPoints(points: number): LevelProgress {
  const p = Math.max(0, Math.floor(points));
  let level = 1;
  let consumed = 0;
  // Hard iteration guard only — NOT a maximum level; the curve grows fast
  // enough that this is unreachable in practice.
  while (level < 100000) {
    const span = pointsForNextLevel(level);
    if (consumed + span > p) break;
    consumed += span;
    level += 1;
  }
  const levelSpan = pointsForNextLevel(level);
  const intoLevel = p - consumed;
  return {
    level,
    points: p,
    intoLevel,
    levelSpan,
    remaining: Math.max(levelSpan - intoLevel, 0),
    percent: levelSpan > 0 ? Math.min(Math.round((intoLevel / levelSpan) * 100), 100) : 0,
  };
}

/** Convenience: activity → level progress. */
export function levelFromActivity(stats: ActivityStats): LevelProgress {
  return levelFromPoints(activityPoints(stats));
}
