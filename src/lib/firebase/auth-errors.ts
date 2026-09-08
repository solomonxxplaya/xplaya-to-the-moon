/** Turns Firebase Auth error codes into plain XPLAYA messages. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    case "auth/email-already-in-use":
      return "That email already has an XPLAYA account. Log in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window.";
    case "auth/unauthorized-domain":
      return `Add "${typeof window === "undefined" ? "this domain" : window.location.hostname}" to Firebase Authentication → Settings → Authorized domains.`;
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled in Firebase Authentication.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    default:
      return (error as Error | null)?.message || "Something went wrong. Try again.";
  }
}
