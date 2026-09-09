/**
 * Firestore reads/writes for the competitive system. Every value comes from
 * the database — when a collection is empty the hooks return empty arrays.
 */
import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb, initFirebase } from "@/lib/firebase/config";
import type {
  MatchDoc,
  MatchRequestDoc,
  MatchResultDoc,
  TournamentDoc,
  TournamentEntryDoc,
} from "./model";
import type { MatchStatus, TournamentStatus } from "./config";

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

export async function getTournament(id: string): Promise<TournamentDoc | null> {
  const db = getDb();
  if (!db || !id) return null;
  try {
    const snap = await getDoc(doc(db, "tournaments", id));
    return snap.exists() ? ({ ...(snap.data() as TournamentDoc), id: snap.id }) : null;
  } catch {
    return null;
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

export async function listTournamentEntries(tournamentId: string): Promise<TournamentEntryDoc[]> {
  const db = getDb();
  if (!db || !tournamentId) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, "tournamentEntries"),
        where("tournamentId", "==", tournamentId),
        fbLimit(200),
      ),
    );
    return snap.docs.map((d) => ({ ...(d.data() as TournamentEntryDoc), id: d.id }));
  } catch {
    return [];
  }
}

export async function joinTournament(tournamentId: string, userId: string, teamName?: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await addDoc(collection(db, "tournamentEntries"), {
    tournamentId,
    userId,
    ...(teamName ? { teamName } : {}),
    status: "registered",
    createdAt: new Date(),
  });
}

export async function withdrawEntry(entryId: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "tournamentEntries", entryId), { status: "withdrawn" });
}

/* ---------------------------------- matches --------------------------------- */

export async function listTournamentMatches(tournamentId: string): Promise<MatchDoc[]> {
  const db = getDb();
  if (!db || !tournamentId) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "matches"), where("tournamentId", "==", tournamentId), fbLimit(200)),
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as MatchDoc), id: d.id }))
      .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || ts(a.createdAt) - ts(b.createdAt));
  } catch {
    return [];
  }
}

export async function listMyMatches(uid: string): Promise<MatchDoc[]> {
  const db = getDb();
  if (!db || !uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "matches"), where("participantIds", "array-contains", uid), fbLimit(60)),
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as MatchDoc), id: d.id }))
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  } catch {
    return [];
  }
}

export async function getMatch(id: string): Promise<MatchDoc | null> {
  const db = getDb();
  if (!db || !id) return null;
  try {
    const snap = await getDoc(doc(db, "matches", id));
    return snap.exists() ? ({ ...(snap.data() as MatchDoc), id: snap.id }) : null;
  } catch {
    return null;
  }
}

export async function setMatchStatus(matchId: string, status: MatchStatus) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "matches", matchId), { status });
}

/* ---------------------------------- results --------------------------------- */

export async function listMatchResults(matchId: string): Promise<MatchResultDoc[]> {
  const db = getDb();
  if (!db || !matchId) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "matchResults"), where("matchId", "==", matchId), fbLimit(50)),
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as MatchResultDoc), id: d.id }))
      .sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
  } catch {
    return [];
  }
}

/** A claimed outcome. Never trusted until an opponent confirms or staff verifies. */
export async function submitMatchResult(
  result: Omit<MatchResultDoc, "id" | "createdAt" | "confirmedBy" | "disputedBy" | "verifiedBy">,
) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await addDoc(collection(db, "matchResults"), {
    ...result,
    confirmedBy: [],
    disputedBy: [],
    createdAt: new Date(),
  });
  await setMatchStatus(result.matchId, "awaiting-confirmation");
}

export async function confirmMatchResult(result: MatchResultDoc, uid: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "matchResults", result.id), {
    confirmedBy: Array.from(new Set([...(result.confirmedBy ?? []), uid])),
  });
}

export async function disputeMatchResult(result: MatchResultDoc, uid: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "matchResults", result.id), {
    disputedBy: Array.from(new Set([...(result.disputedBy ?? []), uid])),
  });
  await setMatchStatus(result.matchId, "disputed");
}

/** Moderator / tournament admin action — the only way a result becomes final. */
export async function verifyMatchResult(result: MatchResultDoc, moderatorUid: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "matchResults", result.id), { verifiedBy: moderatorUid });
  await setMatchStatus(result.matchId, "verified");
}

export async function listDisputedResults(max = 50): Promise<MatchResultDoc[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, "matchResults"), fbLimit(max)));
    return snap.docs
      .map((d) => ({ ...(d.data() as MatchResultDoc), id: d.id }))
      .filter((r) => !r.verifiedBy && (r.disputedBy?.length ?? 0) > 0);
  } catch {
    return [];
  }
}

/* --------------------------------- staff CRUD -------------------------------- */

export async function createTournament(
  tournament: Omit<TournamentDoc, "id" | "createdAt" | "joined">,
) {
  const db = getDb();
  if (!db) throw new Error("offline");
  const ref = await addDoc(collection(db, "tournaments"), {
    ...tournament,
    joined: 0,
    createdAt: new Date(),
  });
  return ref.id;
}

export async function updateTournament(id: string, patch: Partial<TournamentDoc>) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await updateDoc(doc(db, "tournaments", id), patch);
}

export async function deleteTournament(id: string) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await deleteDoc(doc(db, "tournaments", id));
}

export async function createTournamentMatch(match: Omit<MatchDoc, "id" | "createdAt">) {
  const db = getDb();
  if (!db) throw new Error("offline");
  await addDoc(collection(db, "matches"), { ...match, createdAt: new Date() });
}

/* --------------------------------- matchmaking ------------------------------- */

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

/* ------------------------------------ hooks ---------------------------------- */

/** Generic async loader with a manual refresh, used by every competitive screen. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[], initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await initFirebase();
      const rows = await loader();
      if (!cancelled) {
        setData(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, refresh };
}

export function useTournaments() {
  return useAsync<TournamentDoc[]>(() => listTournaments(), [], []);
}

export function useMyEntries(uid: string | null) {
  return useAsync<TournamentEntryDoc[]>(
    () => (uid ? listMyEntries(uid) : Promise.resolve([])),
    [uid],
    [],
  );
}

export const byStatus = (rows: TournamentDoc[], status: TournamentStatus) =>
  rows.filter((r) => r.status === status);
