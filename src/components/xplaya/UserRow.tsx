import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import type { Creator } from "@/lib/types";
import { RankBadge } from "./RankBadge";
import { useFollow } from "@/lib/social";
import { cn } from "@/lib/utils";

/** One real XPLAYA player: tappable to their public profile, with real follow state. */
export function UserRow({ user, showFollow = true }: { user: Creator; showFollow?: boolean }) {
  const { following, busy, toggle, isSelf } = useFollow(user.id);

  return (
    <li className="surface-panel flex items-center gap-3 rounded-2xl p-3">
      <Link
        to="/u/$username"
        params={{ username: user.username }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full bg-surface-2 object-cover"
          />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2">
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">@{user.username}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.displayName}</span>
        </span>
        {user.rank ? <RankBadge rank={user.rank} size="sm" /> : null}
      </Link>
      {showFollow && !isSelf ? (
        <button
          onClick={() => void toggle()}
          disabled={busy}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50",
            following
              ? "border border-border bg-transparent text-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
      ) : null}
    </li>
  );
}
