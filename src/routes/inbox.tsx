import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, UserPlus, Bell, BellOff } from "lucide-react";
import { Screen, FilterChips } from "@/components/layout/Screen";
import { useActivity } from "@/lib/live-data";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — XPLAYA" },
      {
        name: "description",
        content: "Likes, comments, follows, mentions and XPLAYA system updates.",
      },
      { property: "og:title", content: "Inbox — XPLAYA" },
      {
        property: "og:description",
        content: "Your XPLAYA activity: likes, comments, follows and updates.",
      },
    ],
  }),
  component: InboxScreen,
});

const filters = ["All", "Likes", "Comments", "Follows"];
const filterMap: Record<string, "like" | "comment" | "follow"> = {
  Likes: "like",
  Comments: "comment",
  Follows: "follow",
};

const typeIcon = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
} as const;

function InboxScreen() {
  const [filter, setFilter] = useState("All");
  const { uid, isAuthenticated } = useAuth();
  const { data: activity, loading } = useActivity(uid);
  const list =
    filter === "All" ? activity : activity.filter((a) => a.type === filterMap[filter]);

  return (
    <Screen title="Inbox" subtitle="Your activity on XPLAYA">
      <FilterChips options={filters} value={filter} onChange={setFilter} />

      {!isAuthenticated ? (
        <div className="mt-4">
          <EmptyState
            icon={Bell}
            title="Sign in to see your activity"
            description="Likes, comments and new followers on your clips land here."
            action={
              <Button asChild className="rounded-full font-semibold">
                <Link to="/login">Log in</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((item) => {
            const Icon = typeIcon[item.type];
            return (
              <li
                key={item.id}
                className="surface-panel flex items-center gap-3 rounded-2xl p-3"
              >
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
          {!loading && list.length === 0 ? (
            <li>
              <EmptyState
                icon={BellOff}
                title="Nothing here yet"
                description="Activity on your clips and profile will show up here."
              />
            </li>
          ) : null}
        </ul>
      )}
    </Screen>
  );
}
