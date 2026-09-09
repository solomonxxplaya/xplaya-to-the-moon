/**
 * Firestore reads/writes for the competitive system. Every value comes from
 * the database — when a collection is empty the hooks return empty arrays.
 */
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit as fbLimit,
  query,
  where,
} from "firebase/firestore";
import { getDb, initFirebase } from "@/lib/firebase/config";
import type { MatchRequestDoc, TournamentDoc, TournamentEntryDoc } from "./model";
import type { TournamentStatus } from "./config";

const ts = (value: unknown): number => {
  const v = value as { seconds?: number } | undefined;
  return typeof v?.seconds === "number" ? v.seconds * 1000 : 0;
};

export async function listTournaments(max = 60): Promise<TournamentDoc[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, "tournaments"), fbLimit(max)));
    return snap.docs
      .map((d) => ({ ...(d.data() as TournamentDoc), id: d.id }))
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  } catch {
    return [];
  }
}

export async function listMyEntries(uid: string): Promise<TournamentEntryDoc[]> {
  const db = getDb();
  if (!db || !uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "tournamentEntries"), where("userId", "==", uid), fbLimit(60)),
    );
    return snap.docs.map((d) => ({ ...(d.data() as TournamentEntryDoc), id: d.id }));
  } catch {
    return [];
  }
}

export async function createMatchRequest(
  request: Omit<MatchRequestDoc, "id" | "createdAt" | "status">,
) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await addDoc(collection(db, "matchRequests"), {
    ...request,
    status: "open",
    createdAt: new Date(),
  });
}

export function useTournaments() {
  const [data, setData] = useState<TournamentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ready = await initFirebase();
      const rows = ready ? await listTournaments() : [];
      if (!cancelled) {
        setData(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

export function useMyEntries(uid: string | null) {
  const [data, setData] = useState<TournamentEntryDoc[]>([]);
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
      const rows = await listMyEntries(uid);
      if (!cancelled) {
        setData(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { data, loading };
}

export const byStatus = (rows: TournamentDoc[], status: TournamentStatus) =>
  rows.filter((r) => r.status === status);
