/**
 * XPLAYA — messaging data model.
 *
 * Firestore layout (reuses the existing XPLAYA user IDs, no second profile
 * system, no Firebase Storage):
 *
 *   conversations/{conversationId}
 *   conversations/{conversationId}/messages/{messageId}
 *
 * A conversation is either a one-to-one PRIVATE chat or a GROUP. Group
 * ownership and roles are stored on the conversation document and enforced by
 * Firestore security rules — never by the UI alone.
 */

export type ConversationType = "private" | "group";

/** Group roles. Private chats have no roles: both people are equal. */
export type GroupRole = "owner" | "admin" | "member";

/** Who is allowed to perform a group action. */
export type GroupPermission = "owner" | "admins" | "members";

export interface GroupPermissions {
  /** Who can add new members. */
  addMembers: GroupPermission;
  /** Who can change name / image / description. */
  editInfo: GroupPermission;
  /** Who can send messages. */
  sendMessages: GroupPermission;
}

export const defaultGroupPermissions: GroupPermissions = {
  addMembers: "admins",
  editInfo: "admins",
  sendMessages: "members",
};

/** conversations/{id} */
export interface ConversationDoc {
  id: string;
  type: ConversationType;
  /** Every current participant. Used for membership checks and queries. */
  memberIds: string[];
  /** uid -> role. Private conversations use "member" for both sides. */
  roles: Record<string, GroupRole>;
  /** Group only. */
  ownerId?: string;
  createdBy: string;
  name?: string;
  description?: string;
  photoURL?: string;
  permissions?: GroupPermissions;
  /** uid -> unread message count. */
  unread?: Record<string, number>;
  /** uid -> last read time (millis). */
  readAt?: Record<string, number>;
  /** uids who muted notifications for this conversation. */
  mutedBy?: string[];
  /** uids who removed the conversation from their own inbox. */
  hiddenFor?: string[];
  lastMessage?: string;
  lastMessageSenderId?: string;
  /** Millis — kept as a plain number so ordering never depends on an index. */
  lastMessageAt?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** conversations/{id}/messages/{messageId} */
export interface MessageDoc {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  /** Millis, written by the client so ordering is stable before the server ack. */
  createdAt: number;
  deleted?: boolean;
}

/** Deterministic id for a one-to-one chat, so it can never be duplicated. */
export const privateConversationId = (a: string, b: string) =>
  [a, b].sort().join("__");

export const roleOf = (conversation: ConversationDoc, uid: string | null): GroupRole | null =>
  uid ? (conversation.roles?.[uid] ?? null) : null;

export const isMember = (conversation: ConversationDoc, uid: string | null) =>
  Boolean(uid && conversation.memberIds.includes(uid));

export const isGroupOwner = (conversation: ConversationDoc, uid: string | null) =>
  Boolean(uid && conversation.ownerId === uid);

export const isGroupAdmin = (conversation: ConversationDoc, uid: string | null) => {
  const role = roleOf(conversation, uid);
  return role === "owner" || role === "admin";
};

/** Permission check mirrored exactly by the Firestore rules. */
export function canDo(
  conversation: ConversationDoc,
  uid: string | null,
  permission: GroupPermission,
) {
  if (!isMember(conversation, uid)) return false;
  if (permission === "members") return true;
  if (permission === "admins") return isGroupAdmin(conversation, uid);
  return isGroupOwner(conversation, uid);
}
