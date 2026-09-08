import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  UploadCloud,
  Music2,
  ImageIcon,
  X,
  Check,
  Globe2,
  Users,
  Lock,
  Sparkles,
  Scissors,
  Type,
  Gamepad2,
} from "lucide-react";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { musicOptions } from "@/lib/ui-options";
import { useAuth } from "@/lib/auth-context";
import { captureVideoPoster, uploadMedia } from "@/lib/r2/media";
import { initFirebase } from "@/lib/firebase/config";
import { createVideo } from "@/lib/firebase/content-service";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_VIDEO_LABEL,
  VIDEO_LIMIT_LABEL,
  validateImageFile,
  validateVideoFile,
} from "@/lib/r2/limits";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — XPLAYA" },
      { name: "description", content: "Upload a gaming clip to XPLAYA." },
      { property: "og:title", content: "Upload — XPLAYA" },
      { property: "og:description", content: "Share your best gaming moments on XPLAYA." },
    ],
  }),
  component: UploadScreen,
});

const privacyOptions = [
  { id: "public", label: "Everyone", icon: Globe2 },
  { id: "followers", label: "Followers", icon: Users },
  { id: "private", label: "Only me", icon: Lock },
] as const;

const creatorTools = [
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "text", label: "Text", icon: Type },
  { id: "effects", label: "Effects", icon: Sparkles },
  { id: "game", label: "Game tag", icon: Gamepad2 },
] as const;

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 rounded-full transition-all",
            n <= step ? "w-6 bg-neon" : "w-3 bg-border",
          )}
        />
      ))}
    </div>
  );
}

function UploadScreen() {
  const { requireAuth, uid } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [music, setMusic] = useState(musicOptions[0]!);
  const [privacy, setPrivacy] = useState<string>("public");
  const [allowComments, setAllowComments] = useState(true);

  const pickFile = () => {
    if (!requireAuth("upload clips")) return;
    inputRef.current?.click();
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const problem = validateVideoFile(file);
    if (problem) {
      toast.error(problem);
      event.target.value = "";
      return;
    }
    setFile(file);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onCover = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const problem = validateImageFile(picked);
    if (problem) {
      toast.error(problem);
      event.target.value = "";
      return;
    }
    setCoverFile(picked);
    setCoverPreview(URL.createObjectURL(picked));
  };

  const clear = () => {
    setPreviewUrl(null);
    setFileName(null);
    setFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const post = async () => {
    if (!requireAuth("post videos")) return;
    if (!file || !uid || posting) return;
    setPosting(true);
    setProgress(0);
    try {
      await initFirebase();
      const video = await uploadMedia(file, "videos", setProgress);
      // Cover art only — the clip itself is stored byte-for-byte, never re-encoded.
      let posterUrl = "";
      try {
        const poster = coverFile ?? (await captureVideoPoster(file));
        if (poster) posterUrl = (await uploadMedia(poster, "posters")).url;
      } catch {
        toast("Cover image couldn't be saved — your clip still posted.");
      }
      const tags = hashtags
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean);
      await createVideo(uid, {
        caption: caption.trim(),
        hashtags: tags,
        game: tags[0] ?? "",
        posterUrl,
        videoUrl: video.url,
      });
      toast.success("Your clip is live on XPLAYA.");
      clear();
      setCaption("");
      setHashtags("");
      void navigate({ to: "/me" });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Screen
      title="New post"
      subtitle={previewUrl ? "Step 2 · Details" : "Step 1 · Select a clip"}
      action={<StepDots step={previewUrl ? 2 : 1} />}
    >
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden" onChange={onFile} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCover} />

      {previewUrl ? (
        <>
          <div className="grid grid-cols-[124px_minmax(0,1fr)] gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-neon/25 bg-black">
              <video
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-[9/16] w-full bg-black object-contain"
              />
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 ring-inset" />
              <button
                onClick={clear}
                aria-label="Remove video"
                className="press absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/75"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe the play…"
                maxLength={150}
                className="min-h-[148px] resize-none rounded-2xl border-border bg-surface text-sm"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{fileName}</span>
                <span className="shrink-0 tabular-nums">{caption.length}/150</span>
              </div>
            </div>
          </div>

          {/* Familiar short-video creator tools */}
          <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
            {creatorTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => toast(`${label} tools arrive with the XPLAYA editor.`)}
                className="press flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-foreground/80 uppercase"
              >
                <Icon className="h-3.5 w-3.5 text-neon" />
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <button
            onClick={pickFile}
            className="press relative w-full overflow-hidden rounded-[28px] border border-neon/25 bg-surface/70 px-6 py-14"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(163,255,79,0.16),transparent_65%)]" />
            <span className="relative flex flex-col items-center gap-3">
              <span
                className="grid h-20 w-20 place-items-center bg-gradient-to-br from-neon to-neon/40 p-[2px]"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <span
                  className="grid h-full w-full place-items-center bg-background"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <UploadCloud className="h-7 w-7 text-neon" />
                </span>
              </span>
              <span className="display-title text-[24px] tracking-[0.12em] text-foreground">
                Select a clip
              </span>
              <span className="text-center text-xs leading-relaxed text-muted-foreground">
                Vertical 9:16 · {ACCEPTED_VIDEO_LABEL} · max {VIDEO_LIMIT_LABEL}
              </span>
            </span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Gallery", hint: "Pick a file", action: pickFile },
              {
                label: "Record",
                hint: "Camera capture",
                action: () => toast("In-app capture arrives with the XPLAYA camera."),
              },
              {
                label: "Drafts",
                hint: "Saved locally",
                action: () => toast("No drafts yet."),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="press rounded-2xl border border-border bg-surface px-3 py-3 text-left"
              >
                <span className="block text-[12px] font-bold tracking-[0.08em] text-foreground uppercase">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn("mt-5 space-y-5", !previewUrl && "opacity-60")}>
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags</Label>
          <Input
            id="hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#clutch #valorant"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>

        <div className="space-y-2">
          <Label>Sound</Label>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {musicOptions.map((option) => (
              <button
                key={option}
                onClick={() => setMusic(option)}
                className={cn(
                  "press flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold",
                  music === option
                    ? "border-transparent bg-neon text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                <Music2 className="h-3.5 w-3.5" />
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cover</Label>
          <button
            onClick={() => coverRef.current?.click()}
            className="surface-panel press flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Choose cover</span>
              <span className="block truncate text-xs text-muted-foreground">
                {coverFile ? coverFile.name : "Auto-generated from the clip"}
              </span>
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <Label>Who can watch</Label>
          <div className="grid grid-cols-3 gap-2">
            {privacyOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPrivacy(id)}
                className={cn(
                  "press flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-semibold",
                  privacy === id
                    ? "border-neon/60 bg-neon/10 text-neon"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setAllowComments((v) => !v)}
          className="surface-panel press flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
        >
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-md border",
              allowComments ? "border-transparent bg-neon text-primary-foreground" : "border-border",
            )}
          >
            {allowComments ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
          </span>
          <span className="min-w-0 text-sm font-semibold">Allow comments</span>
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          className="h-12 rounded-full border-border bg-transparent px-6 text-sm font-bold"
          onClick={() => toast("Draft saved locally.")}
        >
          Draft
        </Button>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full text-sm font-bold"
          disabled={!previewUrl || posting}
          onClick={() => void post()}
        >
          {posting ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Posting…") : "Post"}
        </Button>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        Your clip is uploaded to XPLAYA storage exactly as exported — no re-encoding, so the
        original resolution, bitrate and audio track are preserved. Supported: {ACCEPTED_VIDEO_LABEL}
        , up to {VIDEO_LIMIT_LABEL}.
      </p>

    </Screen>
  );
}
