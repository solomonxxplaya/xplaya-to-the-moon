/**
 * XPLAYA — browser-side media helper.
 *
 * Uploads go straight from the browser to Cloudflare R2 using a short-lived
 * presigned URL minted on the server. No R2 credential ever reaches the client.
 */
import { deleteMedia } from "./r2.functions";
import { requireAuthClient } from "@/lib/firebase/config";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_LIMIT_LABEL,
  formatBytes,
} from "./limits";

async function idToken() {
  const user = requireAuthClient().currentUser;
  if (!user) throw new Error("Sign in to manage media.");
  return user.getIdToken();
}

export interface UploadedMedia {
  key: string;
  url: string;
}

/**
 * Uploads through the same-origin proxy route. The R2 bucket exposes no CORS
 * policy, so a direct browser PUT to the presigned S3 URL is rejected at the
 * preflight; the proxy forwards the bytes with server-only credentials.
 */
export async function uploadMedia(
  file: File,
  kind: "videos" | "posters" | "avatars" | "media",
  onProgress?: (pct: number) => void,
): Promise<UploadedMedia> {
  const limit = kind === "videos" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(
      kind === "videos"
        ? `This clip is ${formatBytes(file.size)}, over the ${VIDEO_LIMIT_LABEL} upload limit.`
        : `That image is ${formatBytes(file.size)}, over the ${formatBytes(MAX_IMAGE_BYTES)} limit.`,
    );
  }
  if (!file.size) throw new Error("That file is empty.");

  let token: string;
  try {
    token = await idToken();
  } catch {
    throw new Error("Your session expired. Sign in again to upload.");
  }

  return new Promise<UploadedMedia>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/public/media/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-media-kind", kind);
    xhr.setRequestHeader("x-media-filename", encodeURIComponent(file.name).slice(0, 200));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 95));
    };
    xhr.onload = () => {
      let payload: { key?: string; url?: string; error?: string } = {};
      try {
        payload = JSON.parse(xhr.responseText) as typeof payload;
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.key && payload.url) {
        onProgress?.(100);
        resolve({ key: payload.key, url: payload.url });
      } else {
        reject(new Error(payload.error ?? describeUploadStatus(xhr.status)));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Network interrupted during upload. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Try again on a faster connection."));
    xhr.send(file);
  });
}

function describeUploadStatus(status: number): string {
  if (status === 0) return "Network interrupted during upload. Check your connection.";
  if (status === 401 || status === 403) return "Your session expired. Sign in again to upload.";
  if (status === 413) return `That file is too large. The maximum upload size is ${VIDEO_LIMIT_LABEL}.`;
  if (status === 415) return "That file type isn't supported.";
  if (status >= 500) return "Media storage is temporarily unavailable. Please try again.";
  return `Upload failed (${status}).`;
}

export async function removeMedia(keyOrUrl: string) {
  if (!keyOrUrl) return;
  const token = await idToken();
  await deleteMedia({ data: { idToken: token, keyOrUrl } });
}

/** Grabs a poster frame from a local video file before upload. */
export function captureVideoPoster(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      // Keep the poster at the clip's native resolution (capped so the JPEG
      // stays reasonable) instead of downscaling to a fixed 720x1280.
      const nativeW = video.videoWidth || 1080;
      const nativeH = video.videoHeight || 1920;
      const scale = Math.min(1, 1440 / Math.max(nativeW, nativeH));
      canvas.width = Math.round(nativeW * scale);
      canvas.height = Math.round(nativeH * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        cleanup();
        resolve(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null);
      }, "image/jpeg", 0.94);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}
