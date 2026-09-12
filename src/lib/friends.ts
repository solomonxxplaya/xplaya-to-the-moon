/**
 * XPLAYA — friends (mutual follows).
 *
 * A "friend" is a real two-way relationship: both accounts follow each other.
 * Messaging only ever offers friends, so nobody can be added to a private chat
 * or a group unless the follow goes both ways.
 */
import { useEffect, useMemo, useState } from "react";
import { initFirebase } from "@/lib/firebase/config";
import { getFollowers, getFollowing } from "@/lib/firebase/social-service";
import type { PublicProfileDoc } from "@/lib/firebase/model";

/** Profiles that `uid` follows and that follow `uid` back. */
export async function getFriends(uid: string, max = 100): Promise<PublicProfileDoc[]> {
  if (!uid) return [];
  const [following, followers] = await Promise.all([getFollowing(uid, max), getFollowers(uid, max)]);
  const followerIds = new Set(followers.map((p) => p.uid));
  return following
    .filter((p) => followerIds.has(p.uid) && p.uid !== uid)
    .sort((a, b) => a.username.localeCompare(b.username));
}

/** Are these two accounts mutual followers? */
export async function areFriends(a: string, b: string) {
  const friends = await getFriends(a);
  return friends.some((p) => p.uid === b);
}

/** Live-ish friends list for the messaging screens, with a local search term. */
export function useFriends(uid: string | null, term = "") {
  const [data, setData] = useState<PublicProfileDoc[]>([]);
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
      const list = await getFriends(uid);
      if (!cancelled) {
        setData(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase().replace(/^@/, "");
    if (!t) return data;
    return data.filter(
      (p) =>
        p.username.toLowerCase().includes(t) || (p.displayName ?? "").toLowerCase().includes(t),
    );
  }, [data, term]);

  return { data: filtered, loading };
}
