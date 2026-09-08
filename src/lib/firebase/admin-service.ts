/**
 * XPLAYA — admin service.
 *
 * Admin status is derived from the `role` field on the user's public profile
 * document, which normal users cannot modify (enforced in firestore.rules).
 * The UI check here is convenience only; the database is the real gate.
 */
import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb } from "./config";
import type { PublicProfileDoc, ReportDoc, UserRole, VideoDoc } from "./model";

export const ADMIN_ROLES: UserRole[] = ["admin", "owner"];

export const isAdminRole = (role?: UserRole | null) =>
  Boolean(role && ADMIN_ROLES.includes(role));

/** Founding XPLAYA account — the only email allowed to bootstrap a role. */
export const PLATFORM_OWNER_EMAIL = "solomonxxplaya@gmail.com";

/**
 * One-time bootstrap: a brand-new database contains no admin, so no admin can
 * ever promote anyone. The founding account writes its own `owner` role to its
 * profile; Firestore security rules verify the signed-in email, so this is not
 * a client-side trick. Every other admin is granted from the Admin Panel and
 * read back from the database role field.
 */
export async function claimPlatformOwner(uid: string, email?: string | null) {
  if (!uid || email?.toLowerCase() !== PLATFORM_OWNER_EMAIL) return false;
  const db = getDb();
  if (!db) return false;
  try {
    await updateDoc(doc(db, "users", uid), { role: "owner" satisfies UserRole });
    return true;
  } catch {
    return false;
  }
}

export async function listUsers(max = 50): Promise<PublicProfileDoc[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "users"), orderBy("username"), fbLimit(max)));
  return snap.docs.map((d) => d.data() as PublicProfileDoc);
}

export async function listReports(max = 50): Promise<ReportDoc[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "reports"), fbLimit(max)));
  return snap.docs.map((d) => ({ ...(d.data() as ReportDoc), id: d.id }));
}

export async function listVideos(max = 50): Promise<VideoDoc[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "videos"), fbLimit(max)));
  return snap.docs.map((d) => ({ ...(d.data() as VideoDoc), id: d.id }));
}

export interface PlatformStats {
  users: number;
  videos: number;
  comments: number;
  likes: number;
  openReports: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const db = getDb();
  if (!db) return { users: 0, videos: 0, comments: 0, likes: 0, openReports: 0 };
  const [users, videos, comments, likes, reports] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "videos")),
    getCountFromServer(collection(db, "comments")),
    getCountFromServer(collection(db, "likes")),
    getCountFromServer(query(collection(db, "reports"), where("status", "==", "open"))),
  ]);
  return {
    users: users.data().count,
    videos: videos.data().count,
    comments: comments.data().count,
    likes: likes.data().count,
    openReports: reports.data().count,
  };
}

/** Role changes are additionally validated by security rules (admins only). */
export async function setUserRole(uid: string, role: UserRole) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, "users", uid), { role });
}

export async function setReportStatus(reportId: string, status: ReportDoc["status"]) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, "reports", reportId), { status });
}
