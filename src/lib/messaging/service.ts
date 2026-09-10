/**
 * XPLAYA — messaging service.
 *
 * Every read is a real Firestore listener, so private and group conversations
 * update live without polling. Membership, ownership and group permissions are
 * additionally enforced by the published security rules: the helpers below
 * fail on the server for anyone who is not allowed to perform the action.
 */
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDb, initFirebase, requireDb } from "@/lib/firebase/config";
import { getPublicProfile } from "@/lib/firebase/user-service";
import type { PublicProfileDoc } from "@/lib/firebase/model";
import {
  defaultGroupPermissions,
  privateConversationId,
  type ConversationDoc,
  type GroupPermissions,
  type GroupRole,
  type MessageDoc,
} from "./model";

const CONVERSATIONS = "conversations";

const conversationRef = (id: string) => doc(requireDb(), CONVERSATIONS, id);

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

/**
 * Live list of every conversation the signed-in user belongs to.
 * Sorting happens locally so the query never needs a composite index.
 */
export function useConversations(uid: string | null) {
  const [data, setData] = useState<ConversationDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setData([]);
      setLoading(false);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const ready = await initFirebase();
      const db = getDb();
      if (!ready || !db || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      unsubscribe = onSnapshot(
        query(collection(db, CONVERSATIONS), where("memberIds", "array-contains", uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ ...(d.data() as ConversationDoc), id: d.id }))
            .filter((c) => !(c.hiddenFor ?? []).includes(uid))
            .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
          setData(list);
          setLoading(false);
        },
        () => setLoading(false),
      );
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  return { data, loading };
}

/** Live single conversation. */
export function useConversation(id: string | null) {
  const [data, setData] = useState<ConversationDoc | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const ready = await initFirebase();
      const db = getDb();
      if (!ready || !db || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      unsubscribe = onSnapshot(
        doc(db, CONVERSATIONS, id),
        (snap) => {
          setData(snap.exists() ? { ...(snap.data() as ConversationDoc), id: snap.id } : null);
          setLoading(false);
        },
        () => setLoading(false),
      );
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id]);

  return { data, loading };
}

/** Live message list, oldest first, with stable document ids. */
export function useMessages(conversationId: string | null, isMember: boolean) {
  const [data, setData] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(conversationId));

  useEffect(() => {
    if (!conversationId || !isMember) {
      setData([]);
      setLoading(false);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const ready = await initFirebase();
      const db = getDb();
      if (!ready || !db || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      unsubscribe = onSnapshot(
        query(
          collection(db, CONVERSATIONS, conversationId, "messages"),
          orderBy("createdAt", "asc"),
          fbLimit(300),
        ),
        (snap) => {
          setData(snap.docs.map((d) => ({ ...(d.data() as MessageDoc), id: d.id })));
          setLoading(false);
        },
        () => setLoading(false),
      );
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [conversationId, isMember]);

  return { data, loading };
}

/** Resolves the public profiles used by conversation rows and chat bubbles. */
export function useProfiles(uids: string[]) {
  const key = useMemo(() => Array.from(new Set(uids)).sort().join(","), [uids]);
  const [map, setMap] = useState<Record<string, PublicProfileDoc>>({});

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) return;
    let cancelled = false;
    void (async () => {
      await initFirebase();
      const entries = await Promise.all(
        ids.map(async (id) => [id, await getPublicProfile(id)] as const),
      );
      if (cancelled) return;
      setMap((prev) => {
        const next = { ...prev };
        for (const [id, profile] of entries) if (profile) next[id] = profile;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return map;
}

/* ------------------------------------------------------------------ */
/* Private chat                                                        */
/* ------------------------------------------------------------------ */

/** Opens (or creates once) the one-to-one conversation between two users. */
export async function openPrivateConversation(me: string, other: string) {
  if (me === other) throw new Error("You cannot message yourself.");
  const db = requireDb();
  const id = privateConversationId(me, other);
  const ref = doc(db, CONVERSATIONS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const conversation: ConversationDoc = {
      id,
      type: "private",
      memberIds: [me, other].sort(),
      roles: { [me]: "member", [other]: "member" },
      createdBy: me,
      unread: { [me]: 0, [other]: 0 },
      hiddenFor: [],
      mutedBy: [],
      lastMessage: "",
      lastMessageAt: Date.now(),
    };
    await setDoc(ref, { ...conversation, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } else if ((snap.data() as ConversationDoc).hiddenFor?.includes(me)) {
    await updateDoc(ref, { hiddenFor: arrayRemove(me) });
  }
  return id;
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export async function sendMessage(conversation: ConversationDoc, senderId: string, raw: string) {
  const text = raw.trim();
  if (!text) return;
  const db = requireDb();
  const now = Date.now();
  const message: Omit<MessageDoc, "id"> = {
    conversationId: conversation.id,
    senderId,
    text: text.slice(0, 2000),
    createdAt: now,
  };
  await addDoc(collection(db, CONVERSATIONS, conversation.id, "messages"), message);

  // Conversation summary + unread counters for everybody except the sender.
  const patch: Record<string, unknown> = {
    lastMessage: message.text,
    lastMessageSenderId: senderId,
    lastMessageAt: now,
    updatedAt: serverTimestamp(),
    hiddenFor: [],
  };
  for (const uid of conversation.memberIds) {
    if (uid !== senderId) patch[`unread.${uid}`] = increment(1);
  }
  patch[`unread.${senderId}`] = 0;
  await updateDoc(conversationRef(conversation.id), patch);
}

/** Clears the caller's own unread state. Never touches anybody else's. */
export async function markConversationRead(conversationId: string, uid: string) {
  const db = getDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, CONVERSATIONS, conversationId), {
      [`unread.${uid}`]: 0,
      [`readAt.${uid}`]: Date.now(),
    });
  } catch {
    // A read-state write must never break the chat screen.
  }
}

/** A sender may delete their own message; group owners/admins may moderate. */
export async function deleteMessage(conversationId: string, messageId: string) {
  await updateDoc(doc(requireDb(), CONVERSATIONS, conversationId, "messages", messageId), {
    text: "",
    deleted: true,
  });
}

/* ------------------------------------------------------------------ */
/* Conversation management (private + group)                           */
/* ------------------------------------------------------------------ */

/** Removes the conversation from the caller's own inbox only. */
export async function hideConversation(conversationId: string, uid: string) {
  await updateDoc(conversationRef(conversationId), {
    hiddenFor: arrayUnion(uid),
    [`unread.${uid}`]: 0,
  });
}

export async function setMuted(conversationId: string, uid: string, muted: boolean) {
  await updateDoc(conversationRef(conversationId), {
    mutedBy: muted ? arrayUnion(uid) : arrayRemove(uid),
  });
}

/** Files a report into the existing XPLAYA reports & moderation collection. */
export async function reportConversation(input: {
  reporterId: string;
  targetType: "conversation" | "group" | "user" | "message";
  targetId: string;
  reason: string;
}) {
  await addDoc(collection(requireDb(), "reports"), {
    ...input,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

export async function createGroup(input: {
  ownerId: string;
  name: string;
  description?: string;
  photoURL?: string;
  memberIds: string[];
}) {
  const db = requireDb();
  const memberIds = Array.from(new Set([input.ownerId, ...input.memberIds]));
  const roles: Record<string, GroupRole> = { [input.ownerId]: "owner" };
  for (const uid of memberIds) if (uid !== input.ownerId) roles[uid] = "member";

  const ref = await addDoc(collection(db, CONVERSATIONS), {
    type: "group",
    memberIds,
    roles,
    ownerId: input.ownerId,
    createdBy: input.ownerId,
    name: input.name.trim().slice(0, 60),
    description: (input.description ?? "").trim().slice(0, 200),
    photoURL: input.photoURL ?? "",
    permissions: defaultGroupPermissions,
    unread: Object.fromEntries(memberIds.map((uid) => [uid, 0])),
    mutedBy: [],
    hiddenFor: [],
    lastMessage: "Group created",
    lastMessageSenderId: input.ownerId,
    lastMessageAt: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updateGroupInfo(
  conversationId: string,
  patch: { name?: string; description?: string; photoURL?: string },
) {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) data["name"] = patch.name.trim().slice(0, 60);
  if (patch.description !== undefined)
    data["description"] = patch.description.trim().slice(0, 200);
  if (patch.photoURL !== undefined) data["photoURL"] = patch.photoURL;
  await updateDoc(conversationRef(conversationId), data);
}

export async function updateGroupPermissions(
  conversationId: string,
  permissions: GroupPermissions,
) {
  await updateDoc(conversationRef(conversationId), {
    permissions,
    updatedAt: serverTimestamp(),
  });
}

/** Adds members, skipping anybody who already belongs to the group. */
export async function addGroupMembers(conversation: ConversationDoc, uids: string[]) {
  const fresh = uids.filter((uid) => !conversation.memberIds.includes(uid));
  if (fresh.length === 0) return;
  const patch: Record<string, unknown> = {
    memberIds: arrayUnion(...fresh),
    updatedAt: serverTimestamp(),
  };
  for (const uid of fresh) {
    patch[`roles.${uid}`] = "member";
    patch[`unread.${uid}`] = 0;
  }
  await updateDoc(conversationRef(conversation.id), patch);
}

export async function removeGroupMember(conversationId: string, uid: string) {
  await updateDoc(conversationRef(conversationId), {
    memberIds: arrayRemove(uid),
    [`roles.${uid}`]: deleteField(),
    [`unread.${uid}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function setGroupRole(conversationId: string, uid: string, role: GroupRole) {
  await updateDoc(conversationRef(conversationId), {
    [`roles.${uid}`]: role,
    updatedAt: serverTimestamp(),
  });
}

/** Ownership transfer: the new owner is promoted and the old one becomes admin. */
export async function transferGroupOwnership(
  conversation: ConversationDoc,
  newOwnerId: string,
) {
  if (!conversation.ownerId) return;
  await updateDoc(conversationRef(conversation.id), {
    ownerId: newOwnerId,
    [`roles.${newOwnerId}`]: "owner",
    [`roles.${conversation.ownerId}`]: "admin",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Leaving a group. The owner must hand the group over first, so a group can
 * never end up without an owner.
 */
export async function leaveGroup(conversation: ConversationDoc, uid: string) {
  if (conversation.ownerId === uid && conversation.memberIds.length > 1) {
    throw new Error("Transfer ownership before leaving this group.");
  }
  if (conversation.ownerId === uid) {
    await deleteGroup(conversation.id);
    return;
  }
  await removeGroupMember(conversation.id, uid);
}

/** Owner-only (or XPLAYA staff). Deletes the messages, then the group. */
export async function deleteGroup(conversationId: string) {
  const db = requireDb();
  const messages = await getDocs(
    query(collection(db, CONVERSATIONS, conversationId, "messages"), fbLimit(400)),
  );
  if (!messages.empty) {
    const batch = writeBatch(db);
    messages.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, CONVERSATIONS, conversationId));
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const unreadFor = (conversation: ConversationDoc, uid: string | null) =>
  uid ? (conversation.unread?.[uid] ?? 0) : 0;

export const otherMemberId = (conversation: ConversationDoc, uid: string | null) =>
  conversation.memberIds.find((id) => id !== uid) ?? conversation.memberIds[0] ?? "";

/** Small helper for one-shot actions with a busy flag. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      return true;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
