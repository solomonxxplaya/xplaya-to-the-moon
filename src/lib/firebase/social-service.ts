/**
 * XPLAYA — follow graph service.
 *
 * The database is the single source of truth. A follow is one document in
 * `follows` keyed `{followerId}_{followingId}`, which makes the relationship
 * idempotent and survives refresh, restart and re-login.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb, requireDb } from "./config";
import { followId, type FollowDoc, type PublicProfileDoc } from "./model";

export async function isFollowing(followerId: string, followingId: string) {
  const db = getDb();
  if (!db) return false;
  const snap = await getDoc(doc(db, "follows", followId(followerId, followingId)));
  return snap.exists();
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  const db = requireDb();
  const payload: FollowDoc = { followerId, followingId, createdAt: serverTimestamp() };
  await setDoc(doc(db, "follows", followId(followerId, followingId)), payload);
}

export async function unfollowUser(followerId: string, followingId: string) {
  const db = requireDb();
  await deleteDoc(doc(db, "follows", followId(followerId, followingId)));
}

async function profilesFor(uids: string[]): Promise<PublicProfileDoc[]> {
  const db = getDb();
  if (!db || uids.length === 0) return [];
  const snaps = await Promise.all(uids.map((uid) => getDoc(doc(db, "users", uid))));
  return snaps.filter((s) => s.exists()).map((s) => s.data() as PublicProfileDoc);
}

/** Real users that follow `uid`. */
export async function getFollowers(uid: string, max = 50) {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "follows"), where("followingId", "==", uid), fbLimit(max)),
  );
  return profilesFor(snap.docs.map((d) => (d.data() as FollowDoc).followerId));
}

/** Real users that `uid` follows. */
export async function getFollowing(uid: string, max = 50) {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "follows"), where("followerId", "==", uid), fbLimit(max)),
  );
  return profilesFor(snap.docs.map((d) => (d.data() as FollowDoc).followingId));
}

/** Which of the given uids the viewer already follows (for correct list state). */
export async function followStateFor(viewerId: string, uids: string[]) {
  const db = getDb();
  const state: Record<string, boolean> = {};
  if (!db || !viewerId) return state;
  await Promise.all(
    uids.map(async (uid) => {
      const snap = await getDoc(doc(db, "follows", followId(viewerId, uid)));
      state[uid] = snap.exists();
    }),
  );
  return state;
}
