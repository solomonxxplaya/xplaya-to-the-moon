import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, BellOff, Flag, Send, Settings, Trash2, Users, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  canDo,
  isMember as isMemberOf,
} from "@/lib/messaging/model";
import {
  deleteMessage,
  hideConversation,
  markConversationRead,
  reportConversation,
  otherMemberId as pickOther,
  sendMessage,
  setMuted,
  useAction,
  useConversation,
  useMessages,
  useProfiles,
} from "@/lib/messaging/service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat — XPLAYA" },
      { name: "description", content: "Your private and group conversations on XPLAYA." },
      { property: "og:title", content: "Chat — XPLAYA" },
      { property: "og:description", content: "Your private and group conversations on XPLAYA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatScreen,
});

function ChatScreen() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { uid, isAuthenticated } = useAuth();
  const { data: conversation, loading } = useConversation(id);
  const member = Boolean(conversation && isMemberOf(conversation, uid));
  const { data: messages } = useMessages(id, member);
  const otherId = conversation && conversation.type === "private" ? pickOther(conversation, uid) : "";
  const profiles = useProfiles(
    conversation ? (conversation.type === "private" ? [otherId] : conversation.memberIds) : [],
  );
  const [text, setText] = useState("");
  const { busy, run } = useAction();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (member && uid) void markConversationRead(id, uid);
  }, [id, member, uid, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!isAuthenticated) {
    return (
      <Shell title="Chat">
        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-neon">
            Log in
          </Link>{" "}
          to open your conversations.
        </p>
      </Shell>
    );
  }

  if (loading) {
    return <Shell title="Chat"><p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p></Shell>;
  }

  if (!conversation || !member) {
    return (
      <Shell title="Chat">
        <p className="mt-10 text-center text-sm text-muted-foreground">
          This conversation is not available to you.
        </p>
      </Shell>
    );
  }

  const other = profiles[otherId];
  const title =
    conversation.type === "group"
      ? (conversation.name ?? "Group")
      : other?.username
        ? `@${other.username}`
        : "Player";
  const canSend = canDo(conversation, uid, conversation.permissions?.sendMessages ?? "members");
  const muted = (conversation.mutedBy ?? []).includes(uid ?? "");

  const submit = () => {
    const value = text.trim();
    if (!value || !uid) return;
    setText("");
    void run(async () => {
      try {
        await sendMessage(conversation, uid, value);
      } catch {
        toast.error("Message not sent.");
      }
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pb-28">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <button onClick={() => void navigate({ to: "/inbox" })} aria-label="Back" className="press">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {conversation.type === "group" ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2">
            <Users className="h-4 w-4 text-muted-foreground" />
          </span>
        ) : other?.photoURL ? (
          <img src={other.photoURL} alt={title} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {conversation.type === "group"
              ? `${conversation.memberIds.length} members`
              : other?.displayName || "Private chat"}
          </p>
        </div>
        <button
          aria-label={muted ? "Unmute" : "Mute"}
          className="press"
          onClick={() => uid && void setMuted(conversation.id, uid, !muted)}
        >
          {muted ? (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {conversation.type === "group" ? (
          <Link to="/group/$id" params={{ id: conversation.id }} aria-label="Group settings" className="press">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        ) : (
          <button
            aria-label="Report"
            className="press"
            onClick={() =>
              uid &&
              void reportConversation({
                reporterId: uid,
                targetType: "conversation",
                targetId: conversation.id,
                reason: "Reported from chat",
              }).then(
                () => toast.success("Report sent to XPLAYA moderation."),
                () => toast.error("Could not send that report."),
              )
            }
          >
            <Flag className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-2 px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            No messages yet. Say something.
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.senderId === uid;
          const sender = profiles[m.senderId];
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className="max-w-[78%]">
                {conversation.type === "group" && !mine ? (
                  <p className="mb-0.5 text-[10px] font-semibold text-muted-foreground">
                    @{sender?.username ?? "player"}
                  </p>
                ) : null}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-snug",
                    mine ? "bg-neon text-primary-foreground" : "surface-panel",
                    m.deleted && "italic opacity-60",
                  )}
                >
                  {m.deleted ? "Message deleted" : m.text}
                </div>
                {mine && !m.deleted ? (
                  <button
                    className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"
                    onClick={() => void deleteMessage(conversation.id, m.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg border-t border-border bg-background/95 px-4 pt-2 pb-3 backdrop-blur-xl">
        {canSend ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message"
              maxLength={2000}
              className="rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !text.trim()}
              className="shrink-0 rounded-full"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Only group admins can send messages here.
          </p>
        )}
        <button
          className="mt-1 w-full text-center text-[10px] text-muted-foreground"
          onClick={() =>
            uid &&
            void hideConversation(conversation.id, uid).then(() =>
              navigate({ to: "/inbox" }),
            )
          }
        >
          Remove from my inbox
        </button>
      </div>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pt-6 pb-28">
      <h1 className="display-title text-[28px]">{title}</h1>
      {children}
    </div>
  );
}
