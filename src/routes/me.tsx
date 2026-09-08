import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Grid3x3, Bookmark, Heart, Pencil, Share2, ChevronRight, UserRound, Trash2, Play } from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { RankBadge, RankCrest } from "@/components/xplaya/RankBadge";
import { nextRank, formatRank } from "@/lib/ranks";
import { compactNumber } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useUserVideos } from "@/lib/live-data";
import { useConnections } from "@/lib/connections";
import { useProfileCounts, useVideoViewCounts } from "@/lib/social";
import { UserRow } from "@/components/xplaya/UserRow";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { deleteOwnVideo } from "@/lib/firebase/content-service";
import { removeMedia } from "@/lib/r2/media";
import { toast } from "sonner";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your profile — XPLAYA" },
      {
        name: "description",
        content: "Your XPLAYA profile: XP, level, rank, followers and uploads.",
      },
      { property: "og:title", content: "Your profile — XPLAYA" },
      {
        property: "og:description",
        content: "XP, level, rank and uploads on your XPLAYA profile.",
      },
    ],
  }),
  component: ProfileScreen,
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

function ProfileScreen() {
  const { user: p, uid, isAuthenticated, loading } = useAuth();
  const { data: videos } = useUserVideos(uid);
  const [removed, setRemoved] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const removeClip = async (video: { id: string; videoUrl?: string; posterUrl?: string }) => {
    if (!uid || deleting) return;
    if (!window.confirm("Delete this clip? This cannot be undone.")) return;
    setDeleting(video.id);
    try {
      await deleteOwnVideo(video.id, uid);
      await Promise.allSettled([
        video.videoUrl ? removeMedia(video.videoUrl) : Promise.resolve(),
        video.posterUrl ? removeMedia(video.posterUrl) : Promise.resolve(),
      ]);
      setRemoved((list) => [...list, video.id]);
      toast.success("Clip deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this clip.");
    } finally {
      setDeleting(null);
    }
  };

  const ownVideos = videos.filter((v) => !removed.includes(v.id));
  const viewCounts = useVideoViewCounts(ownVideos.map((v) => v.id));
  const [connections, setConnections] = useState<"followers" | "following" | null>(null);
  const followers = useConnections(uid, "followers");
  const following = useConnections(uid, "following");
  const counts = useProfileCounts(uid);


  const settingsAction = (
    <Link
      to="/settings"
      aria-label="Settings"
      className="press grid h-10 w-10 place-items-center rounded-full border border-border bg-surface"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <Screen title="XPLAYA" subtitle="Player profile" action={settingsAction}>
        <EmptyState
          icon={UserRound}
          title={loading ? "Loading your profile" : "Sign in to see your profile"}
          description="Your XP, level, rank and uploads appear here once you're signed in."
          action={
            !loading ? (
              <div className="flex gap-2">
                <Button asChild className="rounded-full font-semibold">
                  <Link to="/signup">Create account</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-border bg-transparent">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            ) : null
          }
        />
        <Link
          to="/rank"
          className="press surface-panel mt-4 flex items-center gap-3 rounded-3xl p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Rank Board</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bronze to Legend — view the full progression.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </Screen>
    );
  }

  if (!p) {
    return (
      <Screen title="XPLAYA" subtitle="Player profile" action={settingsAction}>
        <p className="py-16 text-center text-sm text-muted-foreground">Loading your profile…</p>
      </Screen>
    );
  }

  const xpPercent =
    p.xpToNextLevel > 0 ? Math.min(Math.round((p.xp / p.xpToNextLevel) * 100), 100) : 0;
  const remaining = Math.max(p.xpToNextLevel - p.xp, 0);
  const upcoming = nextRank(p.rank);

  return (
    <Screen title="XPLAYA" subtitle="Player profile" action={settingsAction}>
      {/* Identity header — centered circular avatar with crystal treatment */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-surface/70 px-5 pt-7 pb-5 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_-10%,rgba(163,255,79,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.04)_50%,transparent_55%)]" />

        <div className="relative mx-auto grid h-32 w-32 place-items-center">
          <span className="absolute inset-0 rounded-full bg-neon/25 blur-2xl" />
          <span className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-neon/35" />
          <span className="absolute inset-1.5 rounded-full bg-gradient-to-br from-neon/70 via-neon/10 to-transparent p-[2px]">
            <span className="block h-full w-full rounded-full bg-background" />
          </span>
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.displayName}
              className="relative h-[104px] w-[104px] rounded-full object-cover"
            />
          ) : (
            <span className="relative grid h-[104px] w-[104px] place-items-center rounded-full bg-surface-2">
              <UserRound className="h-10 w-10 text-muted-foreground" />
            </span>
          )}
        </div>

        <h2 className="relative mt-4 truncate font-sans text-[22px] leading-tight font-semibold tracking-normal text-foreground">
          {p.displayName}

        </h2>
        <p className="relative mt-0.5 truncate text-xs text-muted-foreground">@{p.username}</p>
        {p.bio ? (
          <p className="relative mx-auto mt-3 max-w-[34ch] text-[13px] leading-snug text-muted-foreground">
            {p.bio}
          </p>
        ) : null}

        <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface-2/60 py-3">
          <button
            onClick={() => setConnections("following")}
            aria-label="View following"
            className="press rounded-xl"
          >
            <Stat value={compactNumber(counts.following)} label="Following" />
          </button>
          <button
            onClick={() => setConnections("followers")}
            aria-label="View followers"
            className="press rounded-xl"
          >
            <Stat value={compactNumber(counts.followers)} label="Followers" />
          </button>
          <Stat value={compactNumber(counts.likes)} label="Like" />
        </div>

        <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
          <Button
            asChild
            className="h-11 rounded-full bg-foreground font-semibold text-background"
          >
            <Link to="/edit-profile">
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit profile
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-border bg-transparent px-4"
          >
            <Link to="/invite" aria-label="Invite friends">
              <Share2 className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-border bg-transparent px-4"
          >
            <Link to="/settings" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Rank Board — press to open the full Rank View */}
      <Link
        to="/rank"
        aria-label="Open Rank Board"
        className="press relative mt-3 block overflow-hidden rounded-[32px] border border-border bg-surface/70 p-5"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),transparent_45%)]" />
        <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <RankCrest rank={p.rank} size="lg" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Rank Board
            </p>
            <p className="display-title mt-1 truncate text-[28px] leading-none text-foreground">
              {formatRank(p.rank)}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1">
              <span className="text-[10px] font-bold tracking-[0.16em] text-neon uppercase">
                Level {p.level}
              </span>
              <span className="h-3 w-px bg-neon/30" />
              <span className="text-[10px] font-bold text-foreground/80 tabular-nums">
                {p.xp.toLocaleString()} XP
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>

        <div className="relative mt-5">
          <div className="flex items-end justify-between text-[10px] font-bold tracking-[0.16em] uppercase">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground/80 tabular-nums">{xpPercent}%</span>
          </div>
          <div className="mt-2 flex items-center gap-[3px]">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < Math.round((xpPercent / 100) * 24)
                    ? "h-3 flex-1 skew-x-[-20deg] rounded-[2px] bg-neon shadow-[0_0_8px_rgba(163,255,79,0.45)]"
                    : "h-3 flex-1 skew-x-[-20deg] rounded-[2px] bg-white/10"
                }
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {p.xpToNextLevel > 0
                ? `${remaining.toLocaleString()} XP to level ${p.level + 1}`
                : "Earn XP to climb the ladder"}
            </p>
            {upcoming ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Next
                </span>
                <RankBadge rank={upcoming} size="sm" />
              </div>
            ) : null}
          </div>
        </div>
      </Link>

      <Tabs defaultValue="videos" className="mt-4">
        <TabsList className="w-full rounded-full bg-surface p-1">
          <TabsTrigger value="videos" aria-label="Videos" className="h-10 flex-1 rounded-full">
            <Grid3x3 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="liked" aria-label="Liked" className="h-10 flex-1 rounded-full">
            <Heart className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="saved" aria-label="Saved" className="h-10 flex-1 rounded-full">
            <Bookmark className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-3">
          {ownVideos.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">You haven't uploaded any clips yet.</p>
              <Button asChild size="sm" className="mt-3 rounded-full font-semibold">
                <Link to="/upload">Upload a clip</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {ownVideos.map((v) => (
                <div key={v.id} className="group relative overflow-hidden rounded-xl bg-surface-2">
                  <img
                    src={v.posterUrl}
                    alt={v.caption}
                    loading="lazy"
                    className="aspect-[9/16] w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Delete clip"
                    disabled={deleting === v.id}
                    onClick={() => void removeClip(v)}
                    className="press absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {/* Real total views for this clip, TikTok-style under the video */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5">
                    <Play className="h-3 w-3 fill-current text-foreground/90" />
                    <span className="text-[11px] font-bold text-foreground/95 tabular-nums">
                      {compactNumber(viewCounts[v.id] ?? 0)}
                    </span>
                  </div>
                </div>

              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="liked" className="mt-3">
          <p className="py-10 text-center text-sm text-muted-foreground">
            Liked videos appear here.
          </p>
        </TabsContent>
        <TabsContent value="saved" className="mt-3">
          <p className="py-10 text-center text-sm text-muted-foreground">
            Saved videos appear here.
          </p>
        </TabsContent>
      </Tabs>

      <Sheet open={connections !== null} onOpenChange={(open) => !open && setConnections(null)}>
        <SheetContent
          side="bottom"
          className="mx-auto flex h-[72svh] max-w-lg flex-col rounded-t-3xl border-border bg-surface p-0"
        >
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-sm font-semibold">
              {connections === "following" ? "Following" : "Followers"}
            </SheetTitle>
          </SheetHeader>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
            {(() => {
              const list = connections === "following" ? following : followers;
              if (list.loading)
                return (
                  <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
                );
              if (list.data.length === 0)
                return (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {connections === "following"
                      ? "You're not following anyone yet."
                      : "No followers yet."}
                  </p>
                );
              return (
                <ul className="space-y-2">
                  {list.data.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </ul>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </Screen>
  );
}
