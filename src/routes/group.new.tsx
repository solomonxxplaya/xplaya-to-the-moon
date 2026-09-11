import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Search, UserRound } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { searchUsers } from "@/lib/firebase/user-service";
import type { PublicProfileDoc } from "@/lib/firebase/model";
import { createGroup, useAction } from "@/lib/messaging/service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/group/new")({
  head: () => ({
    meta: [
      { title: "Create group — XPLAYA" },
      { name: "description", content: "Create an XPLAYA group chat and invite players." },
      { property: "og:title", content: "Create group — XPLAYA" },
      { property: "og:description", content: "Create an XPLAYA group chat and invite players." },
    ],
  }),
  component: NewGroupScreen,
});

function NewGroupScreen() {
  const { uid, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PublicProfileDoc[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
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

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const create = () => {
    if (!requireAuth("create a group") || !uid) return;
    if (!name.trim()) {
      toast.error("Give the group a name.");
      return;
    }
    void run(async () => {
      try {
        const id = await createGroup({
          ownerId: uid,
          name,
          description,
          memberIds: selected,
        });
        await navigate({ to: "/chat/$id", params: { id } });
      } catch {
        toast.error("Could not create the group.");
      }
    });
  };

  return (
    <Screen title="Create group" subtitle="Name it, then add players">
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          maxLength={60}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this group about? (optional)"
          maxLength={200}
          rows={3}
        />
      </div>

      <div className="relative mt-5">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search players to add"
          className="rounded-full pl-9"
        />
      </div>

      <ul className="mt-3 space-y-2">
        {results.map((u) => {
          const on = selected.includes(u.uid);
          return (
            <li key={u.uid}>
              <button
                onClick={() => toggle(u.uid)}
                className={cn(
                  "surface-panel press flex w-full items-center gap-3 rounded-2xl p-3 text-left",
                  on && "ring-1 ring-neon",
                )}
              >
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="h-10 w-10 rounded-full bg-surface-2 object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-bold">@{u.username}</span>
                {on ? <Check className="h-4 w-4 shrink-0 text-neon" /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        onClick={create}
        disabled={busy}
        className="mt-5 w-full rounded-full font-semibold"
      >
        Create group{selected.length ? ` (${selected.length + 1} members)` : ""}
      </Button>
    </Screen>
  );
}
