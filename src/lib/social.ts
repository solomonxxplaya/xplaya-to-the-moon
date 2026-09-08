/**
 * XPLAYA social hooks — real relationships and real interaction counts.
 *
 * Every count here is derived from the source Firestore collections with
 * server-side aggregation, so counters can never drift: a follow is one
 * document keyed `{followerId}_{followingId}` and a like is one document keyed
 * `{userId}_{videoId}`, which makes both idempotent (no duplicates possible).
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { initFirebase } from "@/lib/firebase/config";
import { followUser, isFollowing, unfollowUser } from "@/lib/firebase/social-service";
import {
  countComments,
  countLikes,
  countShares,
  countViews,
  hasLiked,
  likeVideo,
  recordShare,
  recordView,
  unlikeVideo,
} from "@/lib/firebase/content-service";
import { getProfileCounts } from "@/lib/firebase/user-service";
import { toast } from "sonner";

/** Live follow relationship between the signed-in user and `targetUid`. */
export function useFollow(targetUid: string | null) {
  const { uid, requireAuth } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!uid || !targetUid || uid === targetUid) {
      setFollowing(false);
      return;
    }
    void (async () => {
      await initFirebase();
      const state = await isFollowing(uid, targetUid);
      if (!cancelled) setFollowing(state);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, targetUid]);

  const toggle = useCallback(async () => {
    if (!requireAuth("follow players")) return;
    if (!uid || !targetUid || uid === targetUid || busy) return;
    setBusy(true);
    // Optimistic, then reconciled against the database result.
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followUser(uid, targetUid);
      else await unfollowUser(uid, targetUid);
    } catch {
      setFollowing(!next);
      toast("Couldn't update follow. Try again.");
    } finally {
      setBusy(false);
    }
  }, [busy, following, requireAuth, targetUid, uid]);

  const isSelf = Boolean(uid && targetUid && uid === targetUid);
  return { following, busy, toggle, isSelf, canFollow: Boolean(targetUid) };
}

/** Derived Followers / Following / Likes totals for any profile. */
export function useProfileCounts(uid: string | null, refreshKey = 0) {
  const [counts, setCounts] = useState({ followers: 0, following: 0, likes: 0 });

  useEffect(() => {
    if (!uid) {
      setCounts({ followers: 0, following: 0, likes: 0 });
      return;
    }
    let cancelled = false;
    void (async () => {
      await initFirebase();
      const next = await getProfileCounts(uid);
      if (!cancelled) setCounts(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, refreshKey]);

  return counts;
}

/** Real like / comment / share state and totals for one clip. */
export function useVideoInteractions(video: { id: string; ownerId: string } | null) {
  const { uid, requireAuth } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [views, setViews] = useState(0);

  const videoId = video?.id ?? null;

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    void (async () => {
      await initFirebase();
      const [l, c, s, v, mine] = await Promise.all([
        countLikes(videoId),
        countComments(videoId),
        countShares(videoId),
        countViews(videoId),
        uid ? hasLiked(uid, videoId) : Promise.resolve(false),
      ]);
      if (cancelled) return;
      setLikes(l);
      setComments(c);
      setShares(s);
      setViews(v);
      setLiked(mine);
    })();
    return () => {
      cancelled = true;
    };
  }, [videoId, uid]);

  const setLike = useCallback(
    async (next: boolean) => {
      if (!requireAuth("like clips")) return;
      if (!uid || !video) return;
      if (next === liked) return;
      setLiked(next);
      setLikes((n) => Math.max(n + (next ? 1 : -1), 0));
      try {
        if (next) await likeVideo(uid, video.id, video.ownerId);
        else await unlikeVideo(uid, video.id);
        setLikes(await countLikes(video.id));
      } catch {
        setLiked(!next);
        setLikes(await countLikes(video.id));
        toast("Couldn't update your like. Try again.");
      }
    },
    [liked, requireAuth, uid, video],
  );

  const toggleLike = useCallback(() => void setLike(!liked), [liked, setLike]);

  const registerShare = useCallback(
    async (channel: string) => {
      if (!video) return;
      try {
        await recordShare(video.id, uid, channel);
        setShares(await countShares(video.id));
      } catch {
        /* a failed share record must never break the share itself */
      }
    },
    [uid, video],
  );

  /** One real view event per clip per browser session. */
  const registerView = useCallback(async () => {
    if (!videoId) return;
    const wrote = await recordView(videoId, uid);
    if (wrote) setViews(await countViews(videoId));
  }, [uid, videoId]);

  const refreshComments = useCallback(async () => {
    if (!videoId) return;
    setComments(await countComments(videoId));
  }, [videoId]);

  return {
    liked,
    likes,
    comments,
    shares,
    views,
    toggleLike,
    setLike,
    registerShare,
    registerView,
    refreshComments,
  };
}

/**
 * Real view totals for a set of clips (owner profile grid).
 * Counts come from server aggregation over the recorded view events.
 */
export function useVideoViewCounts(videoIds: string[]) {
  const key = videoIds.join(",");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) {
      setCounts({});
      return;
    }
    let cancelled = false;
    void (async () => {
      await initFirebase();
      const entries = await Promise.all(
        ids.map(async (id) => [id, await countViews(id)] as const),
      );
      if (!cancelled) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return counts;
}
