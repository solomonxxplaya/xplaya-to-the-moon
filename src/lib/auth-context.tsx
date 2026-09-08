import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AuthGateDialog } from "@/components/xplaya/AuthGateDialog";
import type { UserProfile } from "@/lib/types";
import { getFirebaseAuth, initFirebase } from "@/lib/firebase/config";
import { observeAuth, signOutUser } from "@/lib/firebase/auth-service";
import {
  ensureUserDocuments,
  getProfileCounts,
  observeOwnProgression,
  observePublicProfile,
} from "@/lib/firebase/user-service";
import { getUserVideos } from "@/lib/firebase/content-service";
import type { UserRole } from "@/lib/firebase/model";
import { claimPlatformOwner, isAdminRole } from "@/lib/firebase/admin-service";

/**
 * XPLAYA auth + profile context.
 *
 * Everything here is real data from Firebase Authentication and Firestore.
 * When nobody is signed in, `user` is null — no placeholder profile is ever
 * invented.
 */
export interface AuthContextValue {
  uid: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** Public role from the user's Firestore profile. */
  role: UserRole | null;
  /** Convenience flag — admin or owner. */
  isAdmin: boolean;
  /** True until the first auth state has been resolved. */
  loading: boolean;
  /** Returns true when the action may proceed; otherwise opens the auth gate. */
  requireAuth: (action: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [authName, setAuthName] = useState<{ displayName: string; photoURL: string }>({
    displayName: "",
    photoURL: "",
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateAction, setGateAction] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let cancelled = false;
    void initFirebase().then((ready) => {
      if (cancelled) return;
      if (!ready) {
        setLoading(false);
        return;
      }
      unsubscribeAuth = observeAuth((user) => {
        setUid(user?.uid ?? null);
        setAuthName({
          displayName: user?.displayName ?? "",
          photoURL: user?.photoURL ?? "",
        });
        if (!user) {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
      unsubscribeAuth?.();
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    let publicDoc: Awaited<ReturnType<typeof observePublicProfile>> | undefined;
    let progression = { xp: 0, xpToNextLevel: 0, xpToday: 0, xpSession: 0 };
    let counts = { followers: 0, following: 0, posts: 0 };
    let base: {
      username: string;
      displayName: string;
      bio: string;
      photoURL: string;
      rank: UserProfile["rank"];
      level: number;
    } | null = null;

    const publish = () => {
      if (!base) return;
      setProfile({
        id: uid,
        username: base.username,
        displayName: base.displayName || authName.displayName || base.username,
        bio: base.bio,
        avatarUrl: base.photoURL || authName.photoURL,
        rank: base.rank,
        level: base.level,
        xp: progression.xp,
        xpToNextLevel: progression.xpToNextLevel,
        xpToday: progression.xpToday,
        xpSession: progression.xpSession,
        followers: counts.followers,
        following: counts.following,
        posts: counts.posts,
      });
    };

    /**
     * Fallback identity from Firebase Auth. It keeps the profile screen usable
     * when the Firestore document has not been created yet (first sign-in) or
     * a read is momentarily unavailable — no invented stats, only real
     * account values, and it is overwritten as soon as the document arrives.
     */
    const applyFallback = () => {
      if (base) return;
      const fallbackName = authName.displayName || "Player";
      base = {
        username: fallbackName.toLowerCase().replace(/[^a-z0-9._]/g, "") || `player${uid.slice(0, 5)}`,
        displayName: fallbackName,
        bio: "",
        photoURL: authName.photoURL,
        rank: "Bronze I",
        level: 1,
      };
      publish();
    };

    publicDoc = observePublicProfile(uid, (doc) => {
      if (!doc) {
        // Missing document (or an unavailable read): make sure one exists and
        // never leave the screen stuck on a loading state.
        const current = getFirebaseAuth()?.currentUser;
        if (current) void ensureUserDocuments(current).catch(() => undefined);
        applyFallback();
        return;
      }
      setRole(doc.role ?? "user");
      // The founding account claims its 'owner' role in the database once;
      // security rules decide whether the claim is allowed. Everyone else's
      // admin access keeps coming from the role stored on their profile.
      if (!isAdminRole(doc.role ?? "user")) {
        void claimPlatformOwner(uid, getFirebaseAuth()?.currentUser?.email ?? null);
      }
      base = {
        username: doc.username,
        displayName: doc.displayName,
        bio: doc.bio ?? "",
        photoURL: doc.photoURL ?? "",
        rank: doc.rank,
        level: doc.level,
      };
      publish();
    });


    const unsubscribeProgression = observeOwnProgression(uid, (p) => {
      if (p) {
        progression = {
          xp: p.xp ?? 0,
          xpToNextLevel: p.xpToNextLevel ?? 0,
          xpToday: p.xpToday ?? 0,
          xpSession: p.xpSession ?? 0,
        };
        publish();
      }
    });

    void (async () => {
      const [c, videos] = await Promise.all([getProfileCounts(uid), getUserVideos(uid)]);
      counts = { followers: c.followers, following: c.following, posts: videos.length };
      publish();
    })();

    return () => {
      publicDoc?.();
      unsubscribeProgression();
    };
  }, [uid, authName.displayName, authName.photoURL]);

  const requireAuth = useCallback(
    (action: string) => {
      if (uid) return true;
      setGateAction(action);
      return false;
    },
    [uid],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      uid,
      user: profile,
      isAuthenticated: Boolean(uid),
      role,
      isAdmin: isAdminRole(role),
      loading,
      requireAuth,
      signOut: async () => {
        await signOutUser();
        setProfile(null);
        setRole(null);
      },
    }),
    [uid, profile, role, loading, requireAuth],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthGateDialog action={gateAction} onClose={() => setGateAction(null)} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
