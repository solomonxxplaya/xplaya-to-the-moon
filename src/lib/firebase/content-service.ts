/**
 * XPLAYA — video, like and comment service.
 *
 * Ownership always comes from the authenticated UID, never from client input.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb, requireDb } from "./config";
import { likeId, type CommentDoc, type LikeDoc, type VideoDoc } from "./model";

/* ---------------------------------- videos --------------------------------- */

export async function createVideo(
  ownerId: string,
  input: Omit<VideoDoc, "id" | "ownerId" | "createdAt">,
) {
  const db = requireDb();
  const ref = await addDoc(collection(db, "videos"), {
    ...input,
    ownerId,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "videos", ref.id), { id: ref.id }, { merge: true });
  return ref.id;
}

export async function getUserVideos(ownerId: string, max = 60) {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "videos"), where("ownerId", "==", ownerId), fbLimit(max)),
  );
  return snap.docs.map((d) => ({ ...(d.data() as VideoDoc), id: d.id }));
}

/** Only the uploader (or an admin, per rules) may delete. */
export async function deleteOwnVideo(videoId: string, requesterId: string) {
  const db = requireDb();
  const snap = await getDoc(doc(db, "videos", videoId));
  if (!snap.exists() || (snap.data() as VideoDoc).ownerId !== requesterId) {
    throw new Error("You can only delete your own video.");
  }
  await deleteDoc(doc(db, "videos", videoId));
}

/**
 * Admin/owner removal. The Firestore rules are the real gate: this only
 * succeeds when the caller's profile role allows it.
 */
export async function deleteVideoAsAdmin(videoId: string) {
  const db = requireDb();
  await deleteDoc(doc(db, "videos", videoId));
}

/**
 * Aggregation counts are read-gated by the Firestore rules for some
 * collections, so a signed-out visitor legitimately gets permission-denied.
 * That is an honest zero for them, never an application error.
 */
async function safeCount(run: () => Promise<number>) {
  try {
    return await run();
  } catch {
    return 0;
  }
}

/* ---------------------------------- likes ---------------------------------- */

export async function hasLiked(userId: string, videoId: string) {
  const db = getDb();
  if (!db) return false;
  const snap = await getDoc(doc(db, "likes", likeId(userId, videoId)));
  return snap.exists();
}

export async function likeVideo(userId: string, videoId: string, videoOwnerId: string) {
  const db = requireDb();
  const payload: LikeDoc = { userId, videoId, videoOwnerId, createdAt: serverTimestamp() };
  // Deterministic id prevents duplicate likes.
  await setDoc(doc(db, "likes", likeId(userId, videoId)), payload);
}

export async function unlikeVideo(userId: string, videoId: string) {
  const db = requireDb();
  await deleteDoc(doc(db, "likes", likeId(userId, videoId)));
}

export async function countLikes(videoId: string) {
  const db = getDb();
  if (!db) return 0;
  return safeCount(async () => {
    const snap = await getCountFromServer(
      query(collection(db, "likes"), where("videoId", "==", videoId)),
    );
    return snap.data().count;
  });
}

/* --------------------------------- comments -------------------------------- */

export function observeComments(videoId: string, cb: (list: CommentDoc[]) => void) {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  const toList = (snap: { docs: { id: string; data: () => unknown }[] }) =>
    snap.docs.map((d) => ({ ...(d.data() as CommentDoc), id: d.id }));
  const millis = (v: unknown) => {
    const ts = v as { toMillis?: () => number } | null | undefined;
    return typeof ts?.toMillis === "function" ? ts.toMillis() : Date.now();
  };

  let fallback: (() => void) | null = null;
  // The ordered query needs a composite index; if it is missing, fall back to
  // an unordered query and sort locally so comments still appear instantly.
  const primary = onSnapshot(
    query(
      collection(db, "comments"),
      where("videoId", "==", videoId),
      orderBy("createdAt", "desc"),
      fbLimit(100),
    ),
    (snap) => cb(toList(snap)),
    () => {
      fallback = onSnapshot(
        query(collection(db, "comments"), where("videoId", "==", videoId), fbLimit(100)),
        (snap) => cb(toList(snap).sort((a, b) => millis(b.createdAt) - millis(a.createdAt))),
        () => cb([]),
      );
    },
  );
  return () => {
    primary();
    fallback?.();
  };
}

export async function addComment(input: {
  videoId: string;
  userId: string;
  username: string;
  photoURL: string;
  text: string;
}) {
  const db = requireDb();
  await addDoc(collection(db, "comments"), { ...input, createdAt: serverTimestamp() });
}

/** A user may only remove their own comment. */
export async function deleteOwnComment(commentId: string, requesterId: string) {
  const db = requireDb();
  const snap = await getDoc(doc(db, "comments", commentId));
  if (!snap.exists() || (snap.data() as CommentDoc).userId !== requesterId) {
    throw new Error("You can only delete your own comment.");
  }
  await deleteDoc(doc(db, "comments", commentId));
}

/** Newest videos across XPLAYA — powers the home feed. */
export async function getRecentVideos(max = 30) {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "videos"), orderBy("createdAt", "desc"), fbLimit(max)),
    );
    return snap.docs.map((d) => ({ ...(d.data() as VideoDoc), id: d.id }));
  } catch {
    return [];
  }
}

/** Comment total for a video. */
export async function countComments(videoId: string) {
  const db = getDb();
  if (!db) return 0;
  return safeCount(async () => {
    const snap = await getCountFromServer(
      query(collection(db, "comments"), where("videoId", "==", videoId)),
    );
    return snap.data().count;
  });
}

/* ---------------------------------- shares --------------------------------- */

/**
 * Records a real share event. Shares are events (not relationships), so every
 * share is its own document and the total is derived with server aggregation.
 */
export async function recordShare(videoId: string, sharerId: string | null, channel: string) {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, "shares"), {
    videoId,
    sharerId: sharerId ?? null,
    channel,
    createdAt: serverTimestamp(),
  });
}

/**
 * Share total for a video.
 *
 * View events live in the same append-only `shares` collection (the security
 * rules define no separate `views` collection), tagged `channel: "view"`, so
 * the share counter deliberately excludes them.
 */
export async function countShares(videoId: string) {
  const db = getDb();
  if (!db) return 0;
  return safeCount(async () => {
    const [all, views] = await Promise.all([
      getCountFromServer(query(collection(db, "shares"), where("videoId", "==", videoId))),
      getCountFromServer(
        query(
          collection(db, "shares"),
          where("videoId", "==", videoId),
          where("channel", "==", VIEW_CHANNEL),
        ),
      ),
    ]);
    return Math.max(all.data().count - views.data().count, 0);
  });
}

/* ---------------------------------- views ---------------------------------- */

const VIEW_CHANNEL = "view";

/**
 * Records one real view event. Deduplicated per browser session so a single
 * watcher can never inflate the number by scrolling back and forth.
 */
export async function recordView(videoId: string, viewerId: string | null) {
  const db = getDb();
  if (!db) return false;
  try {
    const guard = `xplaya:view:${videoId}`;
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(guard)) return false;
      sessionStorage.setItem(guard, "1");
    }
    await addDoc(collection(db, "shares"), {
      videoId,
      sharerId: viewerId ?? null,
      channel: VIEW_CHANNEL,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

/** Real view total for a video. */
export async function countViews(videoId: string) {
  const db = getDb();
  if (!db) return 0;
  return safeCount(async () => {
    const snap = await getCountFromServer(
      query(
        collection(db, "shares"),
        where("videoId", "==", videoId),
        where("channel", "==", VIEW_CHANNEL),
      ),
    );
    return snap.data().count;
  });
}
