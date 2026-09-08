import { createServerFn } from "@tanstack/react-start";

/**
 * Serves the XPLAYA Firebase web configuration to the browser.
 *
 * The web API key lives in the project's secret store (GOOGLE_API_KEY) instead
 * of the codebase; it is a publishable Firebase web key, so exposing it to the
 * client is expected and safe.
 */
export const getFirebaseWebConfig = createServerFn({ method: "GET" }).handler(async () => ({
  apiKey: process.env["GOOGLE_API_KEY"] ?? "",
  authDomain: "xplaya-kingsmart.firebaseapp.com",
  projectId: "xplaya-kingsmart",
  storageBucket: "xplaya-kingsmart.firebasestorage.app",
  messagingSenderId: "132012423998",
  appId: "1:132012423998:web:1b15baedebc81392838a6f",
  measurementId: "G-Q6YMD7V2QJ",
}));
