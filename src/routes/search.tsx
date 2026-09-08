import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search as SearchIcon, SearchX, Trophy } from "lucide-react";
import { FilterChips } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { UserRow } from "@/components/xplaya/UserRow";
import { useFeed, useUserSearch } from "@/lib/live-data";
import { compactNumber } from "@/lib/format";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — XPLAYA" },
      {
        name: "description",
        content: "Search XPLAYA for clips, players, creators and tournaments.",
      },
      { property: "og:title", content: "Search — XPLAYA" },
      {
        property: "og:description",
        content: "Find gaming clips, creators and tournaments on XPLAYA.",
      },
    ],
  }),
  component: SearchScreen,
});

const categories = ["Videos", "Players", "Creators", "Tournaments"];

function SearchScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]!);
  const q = query.trim().toLowerCase();

  // Real clips and real accounts from Firestore — never fabricated rows.
  const feed = useFeed();
  const people = useUserSearch(query);

  const videos = useMemo(
    () =>
      feed.data.filter(
        (v) =>
          !q ||
          v.caption.toLowerCase().includes(q) ||
          v.game.toLowerCase().includes(q) ||
          v.creator.username.toLowerCase().includes(q),
      ),
    [feed.data, q],
  );

  const showPeople = category === "Players" || category === "Creators";

  return (
    <div className="mx-auto w-full max-w-lg pb-24">
      <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="Back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search XPLAYA"
              aria-label="Search XPLAYA"
              className="h-11 w-full rounded-full border border-border bg-surface pr-4 pl-9 text-sm outline-none focus:border-neon/50"
            />
          </div>
        </div>
        <div className="mt-3">
          <FilterChips options={categories} value={category} onChange={setCategory} />
        </div>
      </header>

      <div className="px-5 pt-5">
        {category === "Tournaments" ? (
          <EmptyState
            icon={Trophy}
            title="No tournaments yet"
            description="Tournaments launch in a later phase — there is nothing to search yet."
          />
        ) : showPeople ? (
          q.length < 2 ? (
            <EmptyState
              icon={SearchIcon}
              title="Search players"
              description="Type at least 2 characters to find real XPLAYA accounts."
            />
          ) : people.loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Searching…</p>
          ) : people.data.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No players found"
              description="Try a different username or display name."
            />
          ) : (
            <ul className="space-y-2">
              {people.data.map((c) => (
                <UserRow key={c.id} user={c} />
              ))}
            </ul>
          )
        ) : feed.loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading clips…</p>
        ) : videos.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No clips found"
            description={
              q ? "Try a different keyword, game or username." : "No clips have been uploaded yet."
            }
          />
        ) : (
          <ul className="grid grid-cols-3 gap-1.5">
            {videos.map((v) => (
              <li key={v.id}>
                <VideoTile
                  videoUrl={v.videoUrl}
                  posterUrl={v.posterUrl}
                  views={v.likes}
                  onOpen={() => setPlayingClip(v)}
                />
              </li>
            ))}
          </ul>
        )}
        <VideoPlayerDialog
          open={playingClip !== null}
          onOpenChange={(open) => !open && setPlayingClip(null)}
          videoUrl={playingClip?.videoUrl}
          posterUrl={playingClip?.posterUrl}
        />
      </div>
    </div>
  );
}
