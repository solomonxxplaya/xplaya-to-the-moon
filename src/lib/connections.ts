/**
 * XPLAYA — followers / following lists.
 *
 * Reads the real `follows` documents and resolves each side to the real public
 * profile, so every row in a list is an actual XPLAYA account.
 */
import { useEffect, useState } from "react";
import type { Creator } from "@/lib/types";
import { initFirebase } from "@/lib/firebase/config";
import { getFollowers, getFollowing } from "@/lib/firebase/social-service";
import { toCreator } from "@/lib/live-data";

export function useConnections(uid: string | null, kind: "followers" | "following", refreshKey = 0) {
  const [data, setData] = useState<Creator[]>([]);
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
      const docs = kind === "followers" ? await getFollowers(uid) : await getFollowing(uid);
      if (!cancelled) {
        setData(docs.map(toCreator));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, kind, refreshKey]);

  return { data, loading };
}
