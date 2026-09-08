import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, UserRound, UserX } from "lucide-react";
import { RankBadge, RankCrest } from "@/components/xplaya/RankBadge";
import { formatRank } from "@/lib/ranks";
import { compactNumber } from "@/lib/format";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { UserRow } from "@/components/xplaya/UserRow";
import { useFollow, useProfileCounts } from "@/lib/social";
import { useConnections } from "@/lib/connections";
import { useUserVideos } from "@/lib/live-data";
import { initFirebase } from "@/lib/firebase/config";
import { getProfileByUsername } from "@/lib/firebase/user-service";
import type { PublicProfileDoc } from "@/lib/firebase/model";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — XPLAYA` },
      {
        name: "description",
        content: `View @${params.username}'s XPLAYA player profile, rank and clips.`,
      },
      { property: "og:title", content: `@${params.username} — XPLAYA` },
      {
        property: "og:description",
        content: `Rank, followers and clips of @${params.username} on XPLAYA.`,
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfileScreen,
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="display-title text-[22px] leading-none text-foreground">{value}</p>
      <p className="mt-1 truncate text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

function PublicProfileScreen() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<PublicProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const ready = await initFirebase();
      if (!ready) {
        if (!cancelled) setLoading(false);
        return;
      }
      const found = await getProfileByUsername(username);
      if (!cancelled) {
        setProfile(found);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const uid = profile?.uid ?? null;
  const { following, busy, toggle, isSelf } = useFollow(uid);
  const [refreshKey, setRefreshKey] = useState(0);
  const counts = useProfileCounts(uid, refreshKey);
  const { data: videos } = useUserVideos(uid);
  const followers = useConnections(uid, "followers", refreshKey);
  const followingList = useConnections(uid, "following", refreshKey);

  const onToggleFollow = async () => {
    await toggle();
    setRefreshKey((n) => n + 1);
  };

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-24">
      <header className="safe-top sticky top-0 z-30 -mx-5 mb-3 flex items-center gap-2 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
        <Link
          to="/search"
          aria-label="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="truncate text-sm font-bold">@{username}</h1>
      </header>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading profile…</p>
      ) : !profile ? (
        <EmptyState
          icon={UserX}
          title="Player not found"
          description={`No XPLAYA account uses @${username}.`}
        />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-[32px] border border-border bg-surface/70 px-5 pt-7 pb-5 text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_-10%,rgba(163,255,79,0.18),transparent_65%)]" />
            <div className="relative mx-auto grid h-28 w-28 place-items-center">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-full bg-surface-2">
                  <UserRound className="h-9 w-9 text-muted-foreground" />
                </span>
              )}
            </div>
            <h2 className="relative mt-4 truncate text-[22px] leading-tight font-semibold">
              {profile.displayName || profile.username}
            </h2>
            <p className="relative mt-0.5 truncate text-xs text-muted-foreground">
              @{profile.username}
            </p>
            {profile.bio ? (
              <p className="relative mx-auto mt-3 max-w-[34ch] text-[13px] leading-snug text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}

            <div className="relative mt-4 flex items-center justify-center gap-2">
              <RankBadge rank={profile.rank} size="sm" />
              <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase">
                Level {profile.level}
              </span>
            </div>

            <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface-2/60 py-3">
              <Stat value={compactNumber(counts.following)} label="Following" />
              <Stat value={compactNumber(counts.followers)} label="Followers" />
              <Stat value={compactNumber(counts.likes)} label="Like" />
            </div>

            {!isSelf ? (
              <button
                onClick={() => void onToggleFollow()}
                disabled={busy}
                className={cn(
                  "relative mt-3 h-11 w-full rounded-full text-sm font-bold disabled:opacity-50",
                  following
                    ? "border border-border bg-transparent text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {following ? "Following" : "Follow"}
              </button>
            ) : (
              <Link
                to="/me"
                className="relative mt-3 block h-11 rounded-full border border-border pt-3 text-sm font-bold"
              >
                Your profile
              </Link>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-border bg-surface/70 p-4">
            <RankCrest rank={profile.rank} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Current rank
              </p>
              <p className="display-title mt-1 truncate text-[24px] leading-none">
                {formatRank(profile.rank)}
              </p>
            </div>
          </div>

          {/* This player's own clips, newest first. Tap any tile to watch. */}
          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Clips
            </p>
            {videos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                @{profile.username} hasn't posted any clips yet.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {videos.map((v) => (
                  <VideoTile
                    key={v.id}
                    videoUrl={v.videoUrl}
                    posterUrl={v.posterUrl}
                    views={viewCounts[v.id] ?? 0}
                    onOpen={() => setPlayingClip(v)}
                  />
                ))}
              </div>
            )}
          </div>

          <VideoPlayerDialog
            open={playingClip !== null}
            onOpenChange={(open) => !open && setPlayingClip(null)}
            videoUrl={playingClip?.videoUrl}
            posterUrl={playingClip?.posterUrl}
          />
        </>
      )}
    </div>
  );
}
