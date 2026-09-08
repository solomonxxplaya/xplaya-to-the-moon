/** XPLAYA — Firebase Authentication service. */
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile as fbUpdateAuthProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, requireAuthClient } from "./config";
import { ensureUserDocuments } from "./user-service";

/**
 * Creating the Firestore user documents must never block a successful sign-in.
 * If security rules or the network reject the write we log it and continue —
 * the session is already valid and the documents are retried on next sign-in.
 */
async function ensureDocsSafely(
  user: User,
  extra?: { username?: string; displayName?: string },
) {
  try {
    await ensureUserDocuments(user, extra);
  } catch (error) {
    console.warn("XPLAYA: could not sync the Firestore user document yet.", error);
  }
}

export type AuthUser = User;

export function observeAuth(cb: (user: AuthUser | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}) {
  const auth = requireAuthClient();
  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const displayName = input.displayName?.trim() || input.username;
  await fbUpdateAuthProfile(cred.user, { displayName });
  await ensureDocsSafely(cred.user, { username: input.username, displayName });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const auth = requireAuthClient();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureDocsSafely(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  const auth = requireAuthClient();
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    await ensureDocsSafely(cred.user);
    return cred.user;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    // Popups are frequently blocked inside embedded previews — fall back to a
    // full-page redirect, which uses the very same authorised domain list.
    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function sendReset(email: string) {
  const auth = requireAuthClient();
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login`,
  });
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  if (auth) await fbSignOut(auth);
}
