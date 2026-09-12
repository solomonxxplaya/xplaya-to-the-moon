import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  BellOff,
  Users,
  MessagesSquare,
  Plus,
  UserRound,
} from "lucide-react";
import { Screen, FilterChips } from "@/components/layout/Screen";
import { useActivity } from "@/lib/live-data";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import {
  useConversations,
  useProfiles,
  unreadFor,
  otherMemberId,
} from "@/lib/messaging/service";
import type { ConversationDoc } from "@/lib/messaging/model";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — XPLAYA" },
      {
        name: "description",
        content:
          "Private chats, groups and your XPLAYA activity: likes, comments, follows and updates.",
      },
      { property: "og:title", content: "Inbox — XPLAYA" },
      {
        property: "og:description",
        content: "Private chats, groups and your XPLAYA activity in one place.",
      },
    ],
  }),
  component: InboxScreen,
});

const tabs = ["Private", "Groups", "Activity"];

const activityFilterIcon = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
} as const;

function InboxScreen() {
  const [tab, setTab] = useState("Private");
  const { uid, isAuthenticated } = useAuth();

  return (
    <Screen title="Inbox" subtitle="Chats, groups and activity">
      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {!isAuthenticated ? (
        <div className="mt-4">
          <EmptyState
            icon={Bell}
            title="Sign in to see your inbox"
            description="Private chats, groups and activity on your clips land here."
            action={
              <Button asChild className="rounded-full font-semibold">
                <Link to="/login">Log in</Link>
              </Button>
            }
          />
        </div>
      ) : tab === "Activity" ? (
        <ActivityList uid={uid} />
      ) : (
        <ChatList uid={uid} type={tab === "Groups" ? "group" : "private"} />
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Private + Groups                                                    */
/* ------------------------------------------------------------------ */

function ChatList({ uid, type }: { uid: string | null; type: "private" | "group" }) {
  const { data, loading } = useConversations(uid);
  const list = data.filter((c) => c.type === type);
  const profiles = useProfiles(
    type === "private" ? list.map((c) => otherMemberId(c, uid)) : [],
  );

  return (
    <div className="mt-4">
      <Button
        asChild
        className="mb-3 w-full rounded-full font-semibold"
        variant={type === "group" ? "default" : "secondary"}
      >
        <Link to={type === "group" ? "/group/new" : "/chat/new"}>
          <Plus className="mr-1 h-4 w-4" />
          {type === "group" ? "Create group" : "New message"}
        </Link>
      </Button>

      {list.length === 0 && !loading ? (
        <EmptyState
          icon={type === "group" ? Users : MessagesSquare}
          title={type === "group" ? "No groups yet" : "No messages yet"}
          description={
            type === "group"
              ? "Create a group to squad up with other players."
              : "Start a private chat with any XPLAYA player."
          }
        />
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              uid={uid}
              title={
                c.type === "group"
                  ? (c.name ?? "Group")
                  : (profiles[otherMemberId(c, uid)]?.username
                      ? `@${profiles[otherMemberId(c, uid)]?.username}`
                      : "Player")
              }
              photoURL={
                c.type === "group"
                  ? (c.photoURL ?? "")
                  : (profiles[otherMemberId(c, uid)]?.photoURL ?? "")
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  uid,
  title,
  photoURL,
}: {
  conversation: ConversationDoc;
  uid: string | null;
  title: string;
  photoURL: string;
}) {
  const unread = unreadFor(conversation, uid);
  return (
    <li>
      <Link
        to="/chat/$id"
        params={{ id: conversation.id }}
        className="surface-panel press flex items-center gap-3 rounded-2xl p-3"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={title}
            className="h-11 w-11 shrink-0 rounded-full bg-surface-2 object-cover"
          />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2">
            {conversation.type === "group" ? (
              <Users className="h-5 w-5 text-muted-foreground" />
            ) : (
              <UserRound className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {conversation.lastMessage || "No messages yet"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {conversation.lastMessageAt ? (
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(conversation.lastMessageAt)}
            </span>
          ) : null}
          {unread > 0 ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-neon px-1.5 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

function ActivityList({ uid }: { uid: string | null }) {
  const { data: activity, loading } = useActivity(uid);

  return (
    <ul className="mt-4 space-y-2">
      {activity.map((item) => {
        const Icon = activityFilterIcon[item.type];
        return (
          <li key={item.id} className="surface-panel flex items-center gap-3 rounded-2xl p-3">
            <div className="relative shrink-0">
              {item.actor?.avatarUrl ? (
                <img
                  src={item.actor.avatarUrl}
                  alt={item.actor.displayName}
                  className="h-11 w-11 rounded-full bg-surface-2 object-cover"
                />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-neon/12 text-neon">
                  <Icon className="h-5 w-5" />
                </span>
              )}
              <span className="absolute -right-0.5 -bottom-0.5 grid h-5 w-5 place-items-center rounded-full border border-background bg-surface-2 text-neon">
                <Icon className="h-3 w-3" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                {item.actor ? (
                  <span className="font-semibold">@{item.actor.username} </span>
                ) : null}
                <span className="text-muted-foreground">{item.text}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
      {!loading && activity.length === 0 ? (
        <li>
          <EmptyState
            icon={BellOff}
            title="Nothing here yet"
            description="Activity on your clips and profile will show up here."
          />
        </li>
      ) : null}
    </ul>
  );
}
