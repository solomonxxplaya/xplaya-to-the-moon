import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useFriends } from "@/lib/friends";
import { openPrivateConversation, useAction } from "@/lib/messaging/service";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/new")({
  head: () => ({
    meta: [
      { title: "New message — XPLAYA" },
      { name: "description", content: "Start a private chat with an XPLAYA friend." },
      { property: "og:title", content: "New message — XPLAYA" },
      { property: "og:description", content: "Start a private chat with an XPLAYA friend." },
    ],
  }),
  component: NewChatScreen,
});

function NewChatScreen() {
  const { uid, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const { data: friends, loading } = useFriends(uid ?? null, term);
  const { busy, run } = useAction();

  const start = (other: string) => {
    if (!requireAuth("send a message") || !uid) return;
    void run(async () => {
      try {
        const id = await openPrivateConversation(uid, other);
        await navigate({ to: "/chat/$id", params: { id } });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not start that chat.");
      }
    });
  };

  return (
    <Screen title="New message" subtitle="Pick a friend">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search your friends"
          className="rounded-full pl-9"
        />
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading your friends…</p>
      ) : friends.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UserRound}
            title="No friends yet"
            description="You can only message players who follow each other. Follow someone back to chat."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {friends.map((u) => (
            <li key={u.uid}>
              <button
                onClick={() => start(u.uid)}
                disabled={busy}
                className="surface-panel press flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-50"
              >
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="h-11 w-11 rounded-full bg-surface-2 object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">@{u.username}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {u.displayName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
