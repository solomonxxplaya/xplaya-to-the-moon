/**
 * XPLAYA — same-origin media upload proxy.
 *
 * The R2 bucket has no public CORS policy, so a browser cannot PUT directly to
 * a presigned S3 URL (the preflight is rejected with 403). The browser instead
 * streams the file to this same-origin route, which verifies the caller's
 * Firebase ID token and forwards the bytes to R2 with server-only credentials.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  buildMediaKey,
  putObject,
  publicUrlFor,
  r2Configured,
  readR2Env,
  verifyFirebaseIdToken,
} from "@/lib/r2/r2.server";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_LIMIT_LABEL,
  formatBytes,
} from "@/lib/r2/limits";

const kinds = new Set(["videos", "posters", "avatars", "media"]);

export const Route = createFileRoute("/api/public/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = readR2Env();
          if (!r2Configured(env)) {
            return Response.json({ error: "Media storage is not configured." }, { status: 500 });
          }
          const kindHeader = request.headers.get("x-media-kind") ?? "media";
          const declared = Number(request.headers.get("content-length") ?? 0);
          const maxBytes = kindHeader === "videos" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
          if (declared && declared > maxBytes) {
            return Response.json(
              {
                error: `That file is ${formatBytes(declared)}. The maximum upload size is ${
                  kindHeader === "videos" ? VIDEO_LIMIT_LABEL : formatBytes(MAX_IMAGE_BYTES)
                }.`,
              },
              { status: 413 },
            );
          }

          const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
          if (!token) return Response.json({ error: "Not authenticated." }, { status: 401 });
          const uid = await verifyFirebaseIdToken(token);

          const kind = kindHeader;
          if (!kinds.has(kind)) return Response.json({ error: "Bad media kind." }, { status: 400 });
          const filename = (request.headers.get("x-media-filename") ?? "file.bin").slice(0, 200);
          const contentType = request.headers.get("content-type") || "application/octet-stream";

          const body = await request.arrayBuffer();
          if (!body.byteLength) return Response.json({ error: "Empty file." }, { status: 400 });
          if (body.byteLength > maxBytes) {
            return Response.json(
              {
                error: `That file is ${formatBytes(body.byteLength)}. The maximum upload size is ${
                  kind === "videos" ? VIDEO_LIMIT_LABEL : formatBytes(MAX_IMAGE_BYTES)
                }.`,
              },
              { status: 413 },
            );
          }
          if (kind === "videos" && contentType !== "application/octet-stream" && !contentType.startsWith("video/")) {
            return Response.json(
              { error: "Unsupported file type. Upload MP4, MOV or WebM." },
              { status: 415 },
            );
          }

          const key = buildMediaKey(uid, kind, filename);
          await putObject(env, key, body, contentType);
          return Response.json({ key, url: publicUrlFor(env, key) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed.";
          const auth = /authenticat/i.test(message);
          const storage = /R2 (upload|delete) failed/i.test(message);
          return Response.json(
            {
              error: storage
                ? "Cloudflare R2 rejected the upload. Please try again in a moment."
                : message,
            },
            { status: auth ? 401 : storage ? 502 : 400 },
          );
        }
      },
    },
  },
});
