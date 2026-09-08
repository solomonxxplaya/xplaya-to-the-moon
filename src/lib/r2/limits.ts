/**
 * XPLAYA — single source of truth for media upload limits.
 *
 * Both the browser (pre-flight validation) and the server upload proxy read
 * these values, so the client can never start an upload the server will reject.
 * The ceiling is dictated by the request body limit of the edge runtime that
 * proxies the bytes into Cloudflare R2.
 */

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/mpeg",
] as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const VIDEO_LIMIT_LABEL = "100 MB";
export const ACCEPTED_VIDEO_LABEL = "MP4, MOV, WebM";

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateVideoFile(file: { name: string; type: string; size: number }): string | null {
  const type = (file.type || "").toLowerCase();
  const extOk = /\.(mp4|mov|m4v|webm|mpeg|mpg)$/i.test(file.name);
  if (type && !type.startsWith("video/")) {
    return `That file isn't a video. Upload ${ACCEPTED_VIDEO_LABEL}.`;
  }
  if (!type && !extOk) {
    return `Unsupported file type. Upload ${ACCEPTED_VIDEO_LABEL}.`;
  }
  if (type && !ACCEPTED_VIDEO_TYPES.includes(type as (typeof ACCEPTED_VIDEO_TYPES)[number]) && !extOk) {
    return `${type} isn't supported. Upload ${ACCEPTED_VIDEO_LABEL}.`;
  }
  if (file.size <= 0) return "That file is empty.";
  if (file.size > MAX_VIDEO_BYTES) {
    return `This clip is ${formatBytes(file.size)}. The maximum upload size is ${VIDEO_LIMIT_LABEL} — trim or export it smaller and try again.`;
  }
  return null;
}

export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  const type = (file.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) return "The cover must be an image (JPG, PNG or WebP).";
  if (file.size > MAX_IMAGE_BYTES) {
    return `That cover is ${formatBytes(file.size)}. Covers must be under ${formatBytes(MAX_IMAGE_BYTES)}.`;
  }
  return null;
}
