import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { searchUsers } from "@/lib/firebase/user-service";
import type { PublicProfileDoc } from "@/lib/firebase/model";
import { openPrivateConversation, useAction } from "@/lib/messaging/service";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/new")({
  head: () => ({
    meta: [
      { title: "New message — XPLAYA" },
      { name: "description", content: "Start a private chat with an XPLAYA player." },
      { property: "og:title", content: "New message — XPLAYA" },
      { property: "og:description", content: "Start a private chat with an XPLAYA player." },
    ],
  }),
  component: NewChatScreen,
});

function NewChatScreen() {
  const { uid, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PublicProfileDoc[]>([]);
  const { busy, run } = useAction();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchUsers(term).then((list) => {
        if (!cancelled) setResults(list.filter((u) => u.uid !== uid));
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, uid]);

  const start = (other: string) => {
    if (!requireAuth("send a message") || !uid) return;
    void run(async () => {
      try {
        const id = await openPrivateConversation(uid, other);
        await navigate({ to: "/chat/$id", params: { id } });
      } catch {
        toast.error("Could not start that chat.");
      }
    });
  };

  return (
    <Screen title="New message" subtitle="Pick a player">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search username"
          className="rounded-full pl-9"
        />
      </div>

      {results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UserRound}
            title="No players found"
            description="Search by username to start a private chat."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {results.map((u) => (
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
