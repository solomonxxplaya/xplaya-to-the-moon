import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { updateOwnProfile } from "@/lib/firebase/user-service";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/r2/media";

export const Route = createFileRoute("/edit-profile")({
  head: () => ({
    meta: [
      { title: "Edit profile — XPLAYA" },
      { name: "description", content: "Update your XPLAYA photo, username, name and bio." },
      { property: "og:title", content: "Edit profile — XPLAYA" },
      { property: "og:description", content: "Update your XPLAYA profile details." },
    ],
  }),
  component: EditProfileScreen,
});

function EditProfileScreen() {
  const router = useRouter();
  const { user, uid, requireAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; displayName?: string }>({});
  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setDisplayName(user.displayName);
    setBio(user.bio);
    setPhotoURL(user.avatarUrl ?? "");
  }, [user]);

  const onPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked || !uid) return;
    setUploadingPhoto(true);
    try {
      const { url } = await uploadMedia(picked, "avatars");
      setPhotoURL(url);
      await updateOwnProfile(uid, { photoURL: url });
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the photo.");
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const save = async () => {
    const next: typeof errors = {};
    if (username.trim().length < 3) next.username = "Username must be at least 3 characters.";
    else if (!/^[a-z0-9_.]+$/i.test(username.trim()))
      next.username = "Use letters, numbers, dots and underscores only.";
    if (displayName.trim().length < 2) next.displayName = "Display name is too short.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!requireAuth("edit your profile")) return;
    if (!uid) return;
    setSaving(true);
    try {
      await updateOwnProfile(uid, {
        username: username.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL,
      });
      toast.success("Profile updated.");
      router.history.back();
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg pb-24">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
        <Link
          to="/me"
          aria-label="Back to profile"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="display-title truncate text-2xl">Edit profile</h1>
      </header>

      {!uid ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-sm text-muted-foreground">Sign in to edit your XPLAYA profile.</p>
          <Button asChild className="mt-4 rounded-full font-semibold">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <div className="px-5 pt-5">
          <div className="flex flex-col items-center gap-3">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPhoto(e)}
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={uploadingPhoto}
              className="press relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-surface-2"
              aria-label="Change profile photo"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={user?.displayName ?? "Profile photo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                <Camera className="h-3 w-3" />
                {uploadingPhoto ? "…" : "Change"}
              </span>
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-2xl border-border bg-surface"
              />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 rounded-2xl border-border bg-surface"
              />
              {errors.displayName ? (
                <p className="text-xs text-destructive">{errors.displayName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-24 rounded-2xl border-border bg-surface"
              />
              <p className="text-right text-[11px] text-muted-foreground">{bio.length}/160</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="h-12 flex-1 rounded-full font-semibold"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-full border-border bg-transparent"
                onClick={() => router.history.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
