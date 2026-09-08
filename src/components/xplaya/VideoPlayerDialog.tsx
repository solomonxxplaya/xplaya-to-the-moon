import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Full-screen tap-to-play viewer used everywhere a clip appears outside the
 * home feed (own profile, other players' profiles, cards). Playback starts
 * WITH sound — the original audio track of the uploaded file is never removed
 * or muted permanently; if the browser blocks unmuted autoplay we fall back to
 * muted start and the user can unmute with the native controls.
 */
export function VideoPlayerDialog({
  open,
  onOpenChange,
  videoUrl,
  posterUrl,
  caption,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl?: string;
  posterUrl?: string;
  caption?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }, [open, videoUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-border bg-black p-0">
        <DialogTitle className="sr-only">{caption || "XPLAYA clip"}</DialogTitle>
        {videoUrl ? (
          <video
            ref={ref}
            src={videoUrl}
            poster={posterUrl}
            controls
            playsInline
            loop
            preload="auto"
            className="aspect-[9/16] max-h-[82svh] w-full bg-black object-contain"
          />
        ) : null}
        {caption ? (
          <p className="px-4 pt-2 pb-4 text-sm text-foreground/90">{caption}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
