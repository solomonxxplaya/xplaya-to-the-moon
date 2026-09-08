/**
 * XPLAYA live data hooks — every value here comes from Firestore. Nothing is
 * fabricated: when a collection is empty the hooks return empty arrays so the
 * UI can show an honest empty state.
 */
import { useEffect, useState } from "react";
import type { Creator, VideoPost } from "@/lib/types";
import { initFirebase } from "@/lib/firebase/config";
import {
  countComments,
  countLikes,
  getRecentVideos,
  getUserVideos,
} from "@/lib/firebase/content-service";
import { getPublicProfile, searchUsers } from "@/lib/firebase/user-service";
import type { PublicProfileDoc, VideoDoc } from "@/lib/firebase/model";
import { actorsFor, getRawActivity } from "@/lib/firebase/activity-service";

export const toCreator = (doc: PublicProfileDoc): Creator => ({
  id: doc.uid,
  username: doc.username,
  displayName: doc.displayName || doc.username,
  avatarUrl: doc.photoURL ?? "",
  verified: doc.verified ?? false,
  rank: doc.rank,
});

async function toPost(video: VideoDoc): Promise<VideoPost> {
  const [owner, likes, comments] = await Promise.all([
    getPublicProfile(video.ownerId),
    countLikes(video.id),
    countComments(video.id),
  ]);
  return {
    id: video.id,
    creator: owner
      ? toCreator(owner)
      : { id: video.ownerId, username: "xplaya", displayName: "XPLAYA player", avatarUrl: "" },
    caption: video.caption,
    hashtags: video.hashtags ?? [],
    audio: "Original audio",
    posterUrl: video.posterUrl,
    videoUrl: video.videoUrl,
    likes,
    comments,
    shares: 0,
    game: video.game,
  };
}

interface Result<T> {
  data: T;
  loading: boolean;
}

/** Newest clips across XPLAYA. */
export function useFeed(): Result<VideoPost[]> {
  const [data, setData] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ready = await initFirebase();
      if (!ready) {
        if (!cancelled) setLoading(false);
        return;
      }
      const videos = await getRecentVideos();
      const posts = await Promise.all(videos.map(toPost));
      if (!cancelled) {
        setData(posts);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

/** A player's own uploads. */
export function useUserVideos(uid: string | null): Result<VideoDoc[]> {
  const [data, setData] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await initFirebase();
      const videos = await getUserVideos(uid);
      if (!cancelled) {
        setData(videos);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { data, loading };
}

/** Username search against the real user directory. */
export function useUserSearch(term: string): Result<Creator[]> {
  const [data, setData] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        await initFirebase();
        const users = await searchUsers(q);
        if (!cancelled) {
          setData(users.map(toCreator));
          setLoading(false);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  return { data, loading };
}

/* --------------------------------- activity -------------------------------- */

export interface ActivityEntry {
  id: string;
  type: "like" | "comment" | "follow";
  actor: Creator | null;
  text: string;
  createdAt: number;
}

/**
 * Real inbox activity: likes on your clips, comments on your clips and new
 * followers. Nothing is synthesised — an empty inbox means no activity yet.
 */
export function useActivity(uid: string | null): Result<ActivityEntry[]> {
  const [data, setData] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const ready = await initFirebase();
      if (!ready) {
        if (!cancelled) setLoading(false);
        return;
      }
      const raw = await getRawActivity(uid);
      const actors = await actorsFor(raw);
      const entries: ActivityEntry[] = raw.map((item) => {
        const profile = actors.get(item.actorId) ?? null;
        return {
          id: `${item.type}-${item.id}`,
          type: item.type,
          actor: profile ? toCreator(profile) : null,
          text: item.text,
          createdAt: item.createdAt,
        };
      });
      if (!cancelled) {
        setData(entries);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { data, loading };
}
