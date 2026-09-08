/**
 * XPLAYA — sound policy.
 *
 * Clips ALWAYS play with their original audio. There is no mute control and
 * nothing in the app mutes a clip on purpose. The only case where a video can
 * start silent is the browser's own autoplay restriction (no user gesture yet):
 * in that case we start the clip muted so it is never frozen, remember it, and
 * turn the sound on automatically at the very first tap anywhere in the app.
 */

const pending = new Set<HTMLVideoElement>();
let listening = false;
let unlocked = false;

function enableSound(video: HTMLVideoElement) {
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1;
}

function listen() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  const handler = () => {
    unlocked = true;
    for (const video of pending) {
      enableSound(video);
      if (video.paused) void video.play().catch(() => undefined);
    }
    pending.clear();
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("touchend", handler, true);
    document.removeEventListener("keydown", handler, true);
    listening = false;
  };
  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("touchend", handler, true);
  document.addEventListener("keydown", handler, true);
}

/** Plays a video with sound; falls back to a silent start only if forced. */
export async function playWithSound(video: HTMLVideoElement): Promise<boolean> {
  enableSound(video);
  try {
    await video.play();
    return true;
  } catch {
    if (unlocked) return false;
    // Autoplay with sound was blocked — start silently and unmute on first tap.
    video.muted = true;
    pending.add(video);
    listen();
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }
}

/** Keeps a video registered for the automatic unmute after it is created. */
export function forgetVideo(video: HTMLVideoElement) {
  pending.delete(video);
}
