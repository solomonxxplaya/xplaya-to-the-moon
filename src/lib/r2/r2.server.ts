/**
 * XPLAYA — Cloudflare R2 server helpers.
 *
 * All R2 credentials live in the project's secret store and are only ever read
 * inside server handlers. The browser never sees the access key or the secret:
 * it receives a short-lived presigned URL for one specific object key.
 */
import { AwsClient } from "aws4fetch";

export interface R2Env {
  endpoint: string;
  bucket: string;
  publicBase: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function readR2Env(): R2Env {
  const accountId = process.env["R2_ACCOUNT_ID"] ?? "";
  return {
    endpoint: (
      process.env["R2_S3_ENDPOINT"] ?? `https://${accountId}.r2.cloudflarestorage.com`
    ).replace(/\/$/, ""),
    bucket: process.env["R2_BUCKET"] ?? "",
    publicBase: (process.env["R2_PUBLIC_BASE_URL"] ?? "").replace(/\/$/, ""),
    accessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? "",
  };
}

export function r2Configured(env: R2Env) {
  return Boolean(env.bucket && env.accessKeyId && env.secretAccessKey && env.publicBase);
}

function client(env: R2Env) {
  return new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

const objectUrl = (env: R2Env, key: string) =>
  `${env.endpoint}/${env.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

export const publicUrlFor = (env: R2Env, key: string) =>
  `${env.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`;

/** Presigned PUT URL so the browser can upload straight to R2. */
export async function signPutUrl(env: R2Env, key: string, contentType: string, expires = 900) {
  const url = new URL(objectUrl(env, key));
  url.searchParams.set("X-Amz-Expires", String(expires));
  const signed = await client(env).sign(
    new Request(url.toString(), { method: "PUT", headers: { "content-type": contentType } }),
    { aws: { signQuery: true, allHeaders: false } },
  );
  return signed.url;
}

/** Server-side upload (used by the same-origin upload proxy). */
export async function putObject(
  env: R2Env,
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
) {
  // Copy into a fresh buffer typed as Uint8Array<ArrayBuffer> so it satisfies BodyInit.
  const data = body instanceof Uint8Array ? new Uint8Array(body) : body;
  const res = await client(env).fetch(objectUrl(env, key), {
    method: "PUT",
    body: data,
    headers: { "content-type": contentType },
  });
  if (!res.ok) throw new Error(`R2 upload failed [${res.status}]: ${await res.text()}`);
}

/** Server-side delete (credentials never leave the server). */
export async function deleteObject(env: R2Env, key: string) {
  const res = await client(env).fetch(objectUrl(env, key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed [${res.status}]: ${await res.text()}`);
  }
}

/** Slug-safe, collision-free media key scoped to the owning user. */
export function buildMediaKey(uid: string, kind: string, filename: string) {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const id = crypto.randomUUID();
  return `${kind}/${uid}/${id}.${ext || "bin"}`;
}

/**
 * Verifies a Firebase ID token with Google's Identity Toolkit and returns the
 * caller's UID. Every privileged R2 operation goes through this first.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  const apiKey = process.env["GOOGLE_API_KEY"] ?? "";
  if (!apiKey || !idToken) throw new Error("Not authenticated.");
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) throw new Error("Not authenticated.");
  const data = (await res.json()) as { users?: Array<{ localId?: string }> };
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new Error("Not authenticated.");
  return uid;
}

/** A user may only touch keys inside their own namespace. */
export function assertOwnsKey(uid: string, key: string) {
  if (!/^[a-z-]+\/[A-Za-z0-9]+\//.test(key) || !key.includes(`/${uid}/`)) {
    throw new Error("You can only modify your own media.");
  }
}

export function keyFromPublicUrl(env: R2Env, url: string) {
  if (!env.publicBase || !url.startsWith(env.publicBase)) return null;
  return decodeURI(url.slice(env.publicBase.length + 1)) || null;
}
