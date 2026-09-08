/**
 * XPLAYA — inbox activity, assembled from real Firestore documents:
 * likes on your clips, comments on your clips and new followers.
 */
import {
  collection,
  getDocs,
  limit as fbLimit,
  query,
  where,
} from "firebase/firestore";
import { getDb } from "./config";
import { getPublicProfile } from "./user-service";
import type { CommentDoc, FollowDoc, LikeDoc, VideoDoc } from "./model";

const millis = (value: unknown) => {
  const ts = value as { toMillis?: () => number } | undefined;
  return typeof ts?.toMillis === "function" ? ts.toMillis() : 0;
};

export interface RawActivity {
  id: string;
  type: "like" | "comment" | "follow";
  actorId: string;
  text: string;
  createdAt: number;
}

export async function getRawActivity(uid: string, max = 40): Promise<RawActivity[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const [likeSnap, followSnap, videoSnap] = await Promise.all([
      getDocs(query(collection(db, "likes"), where("videoOwnerId", "==", uid), fbLimit(max))),
      getDocs(query(collection(db, "follows"), where("followingId", "==", uid), fbLimit(max))),
      getDocs(query(collection(db, "videos"), where("ownerId", "==", uid), fbLimit(30))),
    ]);

    const videoIds = videoSnap.docs.map((d) => (d.data() as VideoDoc).id ?? d.id);
    const commentSnaps = await Promise.all(
      videoIds
        .slice(0, 10)
        .map((videoId) =>
          getDocs(query(collection(db, "comments"), where("videoId", "==", videoId), fbLimit(20))),
        ),
    );

    const items: RawActivity[] = [
      ...likeSnap.docs.map((d) => {
        const like = d.data() as LikeDoc;
        return {
          id: d.id,
          type: "like" as const,
          actorId: like.userId,
          text: "liked your clip",
          createdAt: millis(like.createdAt),
        };
      }),
      ...followSnap.docs.map((d) => {
        const follow = d.data() as FollowDoc;
        return {
          id: d.id,
          type: "follow" as const,
          actorId: follow.followerId,
          text: "started following you",
          createdAt: millis(follow.createdAt),
        };
      }),
      ...commentSnaps.flatMap((snap) =>
        snap.docs
          .map((d) => ({ ...(d.data() as CommentDoc), id: d.id }))
          .filter((c) => c.userId !== uid)
          .map((c) => ({
            id: c.id,
            type: "comment" as const,
            actorId: c.userId,
            text: `commented: ${c.text}`,
            createdAt: millis(c.createdAt),
          })),
      ),
    ];

    return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, max);
  } catch {
    return [];
  }
}

/** Resolves the actor profiles for a list of raw activity rows. */
export async function actorsFor(items: RawActivity[]) {
  const ids = Array.from(new Set(items.map((i) => i.actorId)));
  const profiles = await Promise.all(ids.map((id) => getPublicProfile(id)));
  const map = new Map(ids.map((id, i) => [id, profiles[i] ?? null]));
  return map;
}
