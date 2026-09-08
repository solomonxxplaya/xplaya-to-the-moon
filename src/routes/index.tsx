import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Radio, Film } from "lucide-react";
import { feedCategories } from "@/lib/ui-options";
import { useFeed } from "@/lib/live-data";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { VideoFeedItem } from "@/components/xplaya/VideoFeedItem";
import { XpPulse } from "@/components/xplaya/XpPulse";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "XPLAYA — Watch. Play. Earn." },
      {
        name: "description",
        content:
          "XPLAYA is the social gaming video platform: watch vertical clips, join tournaments, go live and earn XP.",
      },
      { property: "og:title", content: "XPLAYA — Watch. Play. Earn." },
      {
        property: "og:description",
        content: "Short vertical gaming videos, tournaments, live streams and rewards.",
      },
    ],
  }),
  component: HomeFeed,
});

/** Polished in-feed placeholder shown when the Live tab is selected. */
function LiveComingSoon() {
  return (
    <div className="grid h-[100svh] w-full place-items-center bg-black px-6">
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 rounded-full bg-neon/20 blur-2xl" />
          <span
            className="relative grid h-20 w-20 place-items-center bg-gradient-to-br from-neon/70 to-neon/10 p-[2px]"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            <span
              className="grid h-full w-full place-items-center bg-black"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <Radio className="h-7 w-7 text-neon" />
            </span>
          </span>
        </div>
        <p className="display-title mt-6 text-[34px] tracking-[0.16em] text-neon">Coming soon</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">
          XPLAYA Live is in build. Streaming, live tournaments and real-time XP drops arrive in a
          future release.
        </p>
        <Link
          to="/live"
          className="press mt-6 inline-flex h-11 items-center rounded-full border border-neon/50 bg-neon/10 px-6 text-[12px] font-bold tracking-[0.14em] text-neon uppercase"
        >
          Preview live
        </Link>
      </div>
    </div>
  );
}

function HomeFeed() {
  const [category, setCategory] = useState(feedCategories[0]!);
  const { showXpOnHome } = usePrefs();
  const { user } = useAuth();
  const { data: posts, loading } = useFeed();
  const [removed, setRemoved] = useState<string[]>([]);
  const visiblePosts = posts.filter((post) => !removed.includes(post.id));

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent pb-6">
        <div className="pointer-events-auto flex items-center gap-2 px-4 pt-1.5">
          <span className="display-title shrink-0 text-xl leading-none tracking-[0.16em] text-foreground">
            XPLAYA
          </span>
          {showXpOnHome && user ? (
            <XpPulse profile={user} className="ml-auto min-w-0 shrink" />
          ) : (
            <span className="ml-auto" />
          )}
          <Link
            to="/search"
            aria-label="Search"
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-black/40 text-foreground/85 backdrop-blur-md"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>
        <div className="no-scrollbar pointer-events-auto mt-1 flex gap-5 overflow-x-auto px-4">
          {feedCategories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                "shrink-0 pb-1 text-[12px] font-bold tracking-[0.12em] uppercase transition-colors",
                category === item
                  ? "border-b-2 border-neon text-foreground"
                  : "border-b-2 border-transparent text-foreground/55",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {category === "Live" ? (
        <LiveComingSoon />
      ) : (
        <div className="no-scrollbar h-[100svh] snap-y snap-mandatory overflow-y-scroll">
          {visiblePosts.map((post) => (
            <VideoFeedItem
              key={post.id}
              post={post}
              onDeleted={(id) => setRemoved((list) => [...list, id])}
            />
          ))}
          {!loading && visiblePosts.length === 0 ? (
            <div className="grid h-[100svh] w-full place-items-center bg-black px-6">
              <EmptyState
                icon={Film}
                title="No clips yet"
                description="XPLAYA clips appear here as soon as players start uploading."
                action={
                  <Link
                    to="/upload"
                    className="press inline-flex h-11 items-center rounded-full border border-neon/50 bg-neon/10 px-6 text-[12px] font-bold tracking-[0.14em] text-neon uppercase"
                  >
                    Upload a clip
                  </Link>
                }
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
