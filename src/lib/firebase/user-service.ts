/**
 * XPLAYA — user service.
 *
 * Owns the public/private split of the user record and all profile reads.
 * Counts (following / followers / likes) are always derived from the source
 * collections with server-side aggregation, so they can never drift and no
 * client is ever allowed to write a counter field.
 */
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
  endAt,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb, requireDb } from "./config";
import type { PrivateProgressionDoc, PublicProfileDoc } from "./model";

const DEFAULT_XP_TO_NEXT = 5000;

function slugUsername(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 24);
}

/** Creates the public profile + private progression documents if missing. */
export async function ensureUserDocuments(
  user: User,
  extra?: { username?: string; displayName?: string },
) {
  const db = getDb();
  if (!db) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const username = slugUsername(
      extra?.username || user.displayName || user.email?.split("@")[0] || `player${user.uid.slice(0, 5)}`,
    );
    const profile: PublicProfileDoc = {
      uid: user.uid,
      username,
      usernameLower: username.toLowerCase(),
      displayName: extra?.displayName || user.displayName || username,
      bio: "",
      photoURL: user.photoURL ?? "",
      rank: "Bronze I",
      level: 1,
      role: "user",
      verified: false,
      suspended: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
  }

  const progressionRef = doc(db, "users", user.uid, "private", "progression");
  const progressionSnap = await getDoc(progressionRef);
  if (!progressionSnap.exists()) {
    const progression: PrivateProgressionDoc = {
      xp: 0,
      xpToNextLevel: DEFAULT_XP_TO_NEXT,
      xpToday: 0,
      xpSession: 0,
      updatedAt: serverTimestamp(),
    };
    await setDoc(progressionRef, progression);
  }
}

export async function getPublicProfile(uid: string): Promise<PublicProfileDoc | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as PublicProfileDoc) : null;
}

export function observePublicProfile(
  uid: string,
  cb: (profile: PublicProfileDoc | null) => void,
) {
  const db = getDb();
  if (!db) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => cb(snap.exists() ? (snap.data() as PublicProfileDoc) : null),
    () => cb(null),
  );
}

/**
 * Reads the signed-in user's OWN progression. Security rules reject this read
 * for anyone else, so exact XP can never leak to another account.
 */
export function observeOwnProgression(
  uid: string,
  cb: (p: PrivateProgressionDoc | null) => void,
) {
  const db = getDb();
  if (!db) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "users", uid, "private", "progression"),
    (snap) => cb(snap.exists() ? (snap.data() as PrivateProgressionDoc) : null),
    () => cb(null),
  );
}

/**
 * Safe profile fields the owner is allowed to change.
 *
 * The published security rules accept only
 * `displayName, username, bio, photoURL, avatar, coverPhoto, updatedAt`, so
 * this never writes a derived `usernameLower` field. Usernames are already
 * slugged to lowercase, so all lookups below read `username` directly.
 */
export async function updateOwnProfile(
  uid: string,
  patch: { displayName?: string; bio?: string; username?: string; photoURL?: string },
) {
  const db = requireDb();
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.displayName !== undefined) data["displayName"] = patch.displayName;
  if (patch.bio !== undefined) data["bio"] = patch.bio;
  if (patch.photoURL !== undefined) data["photoURL"] = patch.photoURL;
  if (patch.username !== undefined) data["username"] = slugUsername(patch.username);
  await updateDoc(doc(db, "users", uid), data);
}

/** Real user search by username prefix. */
export async function searchUsers(term: string, max = 20): Promise<PublicProfileDoc[]> {
  const db = getDb();
  if (!db) return [];
  const t = term.trim().toLowerCase().replace(/^@/, "");
  const col = collection(db, "users");
  if (!t) {
    const snap = await getDocs(query(col, orderBy("username"), fbLimit(max)));
    return snap.docs.map((d) => d.data() as PublicProfileDoc);
  }
  const snap = await getDocs(
    query(col, orderBy("username"), startAt(t), endAt(`${t}\uf8ff`), fbLimit(max)),
  );
  return snap.docs.map((d) => d.data() as PublicProfileDoc);
}

export async function getProfileByUsername(username: string): Promise<PublicProfileDoc | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("username", "==", slugUsername(username.replace(/^@/, ""))),
      fbLimit(1),
    ),
  );
  const first = snap.docs[0];
  return first ? (first.data() as PublicProfileDoc) : null;
}


export interface ProfileCounts {
  following: number;
  followers: number;
  likes: number;
}

/** Derived, tamper-proof profile counts: Following | Followers | Like. */
export async function getProfileCounts(uid: string): Promise<ProfileCounts> {
  const db = getDb();
  if (!db) return { following: 0, followers: 0, likes: 0 };
  try {
    const [following, followers, likes] = await Promise.all([
      getCountFromServer(query(collection(db, "follows"), where("followerId", "==", uid))),
      getCountFromServer(query(collection(db, "follows"), where("followingId", "==", uid))),
      getCountFromServer(query(collection(db, "likes"), where("videoOwnerId", "==", uid))),
    ]);
    return {
      following: following.data().count,
      followers: followers.data().count,
      likes: likes.data().count,
    };
  } catch {
    // A rules/network failure must not fabricate numbers or crash the screen.
    return { following: 0, followers: 0, likes: 0 };
  }
}

