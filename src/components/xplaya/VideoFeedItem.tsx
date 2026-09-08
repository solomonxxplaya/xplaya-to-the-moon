import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Music2,
  Play,
  BadgeCheck,
  MoreVertical,
  Trash2,
  Pencil,
  Link2,
} from "lucide-react";
import { playWithSound } from "@/lib/audio-unlock";

import type { VideoPost } from "@/lib/types";
import { compactNumber } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useFollow, useVideoInteractions } from "@/lib/social";
import { cn } from "@/lib/utils";
import { RankBadge } from "./RankBadge";
import { CommentsSheet } from "./CommentsSheet";
import { ShareSheet } from "./ShareSheet";
import { ReportDialog } from "./ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteOwnVideo } from "@/lib/firebase/content-service";
import { removeMedia } from "@/lib/r2/media";
import { toast } from "sonner";

/**
 * Large, TikTok-style rail action: a big tappable glyph with the live count
 * underneath. Sized for thumbs (56px glyph, 64px hit area).
 */
function ActionButton({
  label,
  ariaLabel,
  onClick,
  active,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="press flex w-16 flex-col items-center justify-center gap-1.5 py-1"
    >
      <span
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full transition-transform duration-150 active:scale-90",
          active ? "text-neon" : "text-foreground",
        )}
      >
        {children}
      </span>
      <span className="text-[13px] leading-none font-bold text-foreground tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        {label}
      </span>
    </button>
  );
}


export function VideoFeedItem({
  post,
  onDeleted,
}: {

  post: VideoPost;
  onDeleted?: (id: string) => void;
}) {
  const { requireAuth, uid } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [burst, setBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { liked, likes, comments, shares, toggleLike, setLike, registerShare, registerView } =
    useVideoInteractions({ id: post.id, ownerId: post.creator.id });
  const { following, toggle: toggleFollow, isSelf } = useFollow(post.creator.id);

  /** Always starts the clip with its own audio — XPLAYA never mutes on purpose. */
  const startPlayback = async (video: HTMLVideoElement) => {
    const ok = await playWithSound(video);
    setPlaying(ok);
  };


  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          void registerView();
          void startPlayback(video);
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerView]);


  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void startPlayback(video);
    } else {
      video.pause();
      setPlaying(false);
    }
  };


  const onSurfaceTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      if (requireAuth("like clips")) {
        void setLike(true);
        setBurst(true);
        window.setTimeout(() => setBurst(false), 500);
      }
      return;
    }
    lastTap.current = now;
    window.setTimeout(() => {
      if (lastTap.current !== 0 && Date.now() - lastTap.current >= 280) {
        lastTap.current = 0;
        toggle();
      }
    }, 290);
  };

  // The three-dot menu is owner-only: viewers never see owner controls.
  const isOwner = Boolean(uid && uid === post.creator.id);

  const handleDelete = async () => {
    if (deleting || !isOwner) return;
    if (!window.confirm("Delete this clip? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteOwnVideo(post.id, uid!);

      await Promise.allSettled([
        post.videoUrl ? removeMedia(post.videoUrl) : Promise.resolve(),
        post.posterUrl ? removeMedia(post.posterUrl) : Promise.resolve(),
      ]);
      toast.success("Clip deleted.");
      onDeleted?.(post.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this clip.");
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/?clip=${post.id}` : "";

  return (
    <section
      ref={containerRef}
      className="relative h-[100svh] w-full snap-start snap-always overflow-hidden bg-black"
    >
      {/* 9:16 viewing frame: the whole clip is always visible (letterboxed when
          it is not vertical) and never cropped, stretched or distorted. */}
      <video
        ref={videoRef}
        src={post.videoUrl}
        poster={post.posterUrl}
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
      <button
        onClick={onSurfaceTap}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute inset-0 h-full w-full"
      >
        {!playing ? (
          <span className="grid h-full w-full place-items-center">
            <Play className="h-16 w-16 text-foreground/70" fill="currentColor" />
          </span>
        ) : null}
      </button>

      {burst ? (
        <Heart className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 fill-neon text-neon animate-in fade-in zoom-in-50 duration-300" />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* Right action rail — large, modern, TikTok-style controls */}
      <div className="absolute right-1 bottom-[104px] flex flex-col items-center gap-4">
        <div className="relative mb-4">
          <Link
            to="/u/$username"
            params={{ username: post.creator.username }}
            aria-label={`Open @${post.creator.username}`}
          >
            <img
              src={post.creator.avatarUrl}
              alt={post.creator.displayName}
              loading="lazy"
              className="h-[52px] w-[52px] rounded-full border-2 border-white/85 bg-surface object-cover"
            />
          </Link>
          {!isSelf && !following ? (
            <button
              onClick={() => void toggleFollow()}
              aria-label={`Follow ${post.creator.username}`}
              className="neon-ring absolute -bottom-2.5 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
            </button>
          ) : null}
        </div>

        <ActionButton
          label={compactNumber(likes)}
          ariaLabel={liked ? "Unlike clip" : "Like clip"}
          active={liked}
          onClick={() => void toggleLike()}
        >
          <Heart
            className={cn(
              "h-9 w-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] transition-transform",
              liked && "fill-neon scale-110",
            )}
          />
        </ActionButton>

        <ActionButton
          label={compactNumber(comments)}
          ariaLabel="Open comments"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="h-9 w-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
        </ActionButton>

        <ActionButton
          label={compactNumber(shares)}
          ariaLabel="Share clip"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-9 w-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
        </ActionButton>

        {/* Owner-only options. Viewers never see this control. */}
        {isOwner ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Your clip options"
                className="press grid h-12 w-12 place-items-center rounded-full text-foreground"
              >
                <MoreVertical className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="left"
              className="w-52 rounded-2xl border-border bg-surface"
            >
              <DropdownMenuItem asChild>
                <Link to="/upload">
                  <Pencil className="mr-2 h-4 w-4" />
                  Upload new clip
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void copyLink()}>
                <Link2 className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShareOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deleting}
                className="text-destructive focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setMenuOpen(false);
                  void handleDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete clip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Music indicator */}
        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md">
          <Music2 className="h-4 w-4 animate-pulse text-neon" />
        </div>
      </div>


      {/* Video information — username, caption, rank, music */}
      <div className="absolute right-[76px] bottom-[92px] left-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            to="/u/$username"
            params={{ username: post.creator.username }}
            className="truncate text-[15px] font-extrabold"
          >
            @{post.creator.username}
          </Link>
          {post.creator.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-neon" /> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-foreground/90">
          {post.caption}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-neon">
          {post.hashtags.join(" ")}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
          {post.creator.rank ? <RankBadge rank={post.creator.rank} size="sm" /> : null}
          <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-foreground/80 uppercase">
            {post.game}
          </span>
        </div>
        {/* The view total is deliberately not shown on the Home feed — it
            appears on the owner's profile, under the clip. */}

        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-foreground/75">
          <Music2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{post.audio}</span>
        </div>
      </div>

      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        videoId={post.id}
        count={comments}
      />
      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareUrl={shareUrl}
        onReport={() => setReportOpen(true)}
        onShared={(channel) => void registerShare(channel)}
      />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </section>
  );
}
