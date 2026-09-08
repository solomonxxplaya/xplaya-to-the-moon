/**
 * XPLAYA — single, centralised Firebase entry point.
 *
 * This file is the ONLY place where the Firebase app is created. Never call
 * `initializeApp` anywhere else and never import `firebase/*` directly from a
 * UI component — go through the services in this folder instead.
 *
 * Services intentionally enabled:
 *   - Firebase Authentication
 *   - Cloud Firestore
 *
 * Services intentionally NOT enabled: Firebase Storage (XPLAYA media lives on
 * Cloudflare R2) and Firebase Analytics. The `storageBucket` field below is
 * part of the given web configuration only — nothing uses it.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseWebConfig } from "./config.functions";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

let config: FirebaseWebConfig | null = null;
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initPromise: Promise<boolean> | null = null;

/** True once a usable web configuration has been loaded in the browser. */
export function isFirebaseConfigured() {
  return Boolean(config?.apiKey && config.appId && config.projectId);
}

/**
 * Loads the web configuration (API key comes from the secret store) and boots
 * the Firebase app. Safe to call repeatedly; resolves false when the key is
 * missing so the UI can stay usable.
 */
export function initFirebase(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const loaded = (await getFirebaseWebConfig()) as FirebaseWebConfig;
        if (!loaded?.apiKey) return false;
        config = loaded;
        app = getApps().length ? getApp() : initializeApp(loaded);
        return true;
      } catch {
        return false;
      }
    })();
  }
  return initPromise;
}

/** Firebase Auth, or null when running on the server / before init. */
export function getFirebaseAuth(): Auth | null {
  if (!app) return null;
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}

/** Cloud Firestore, or null when running on the server / before init. */
export function getDb(): Firestore | null {
  if (!app) return null;
  if (!dbInstance) dbInstance = getFirestore(app);
  return dbInstance;
}

/** Throwing accessor for call sites that require a live connection. */
export function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error("XPLAYA: Firestore is not available (missing configuration).");
  return db;
}

export function requireAuthClient(): Auth {
  const a = getFirebaseAuth();
  if (!a) throw new Error("XPLAYA: Firebase Auth is not available (missing configuration).");
  return a;
}
