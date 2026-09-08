import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  assertOwnsKey,
  buildMediaKey,
  deleteObject,
  keyFromPublicUrl,
  publicUrlFor,
  r2Configured,
  readR2Env,
  signPutUrl,
  verifyFirebaseIdToken,
} from "./r2.server";
import { MAX_VIDEO_BYTES } from "./limits";

const uploadInput = z.object({
  idToken: z.string().min(10),
  kind: z.enum(["videos", "posters", "avatars", "media"]),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

/** Issues a short-lived presigned PUT URL for one object owned by the caller. */
export const createUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => uploadInput.parse(data))
  .handler(async ({ data }) => {
    const env = readR2Env();
    if (!r2Configured(env)) throw new Error("Media storage is not configured.");
    const uid = await verifyFirebaseIdToken(data.idToken);
    const key = buildMediaKey(uid, data.kind, data.filename);
    const uploadUrl = await signPutUrl(env, key, data.contentType);
    return { key, uploadUrl, publicUrl: publicUrlFor(env, key) };
  });

/** Deletes one object the caller owns (by key or by its public URL). */
export const deleteMedia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ idToken: z.string().min(10), keyOrUrl: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const env = readR2Env();
    if (!r2Configured(env)) throw new Error("Media storage is not configured.");
    const uid = await verifyFirebaseIdToken(data.idToken);
    const key = data.keyOrUrl.startsWith("http")
      ? keyFromPublicUrl(env, data.keyOrUrl)
      : data.keyOrUrl;
    if (!key) throw new Error("Unknown media reference.");
    assertOwnsKey(uid, key);
    await deleteObject(env, key);
    return { deleted: key };
  });

/** Lightweight health probe used by the settings screen. */
export const mediaStorageStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: r2Configured(readR2Env()),
}));
