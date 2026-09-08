import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { addComment, observeComments } from "@/lib/firebase/content-service";
import type { CommentDoc } from "@/lib/firebase/model";
import { compactNumber, timeAgo } from "@/lib/format";
import { toast } from "sonner";

/** Firestore Timestamp -> millis, tolerant of pending server timestamps. */
function millisOf(value: unknown): number {
  const ts = value as { toMillis?: () => number } | null | undefined;
  return typeof ts?.toMillis === "function" ? ts.toMillis() : 0;
}

/** Real comment thread for one clip — everything comes from Firestore. */
export function CommentsSheet({
  open,
  onOpenChange,
  videoId,
  count,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  count: number;
}) {
  const { requireAuth, uid, user } = useAuth();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [pending, setPending] = useState<CommentDoc[]>([]);

  useEffect(() => {
    if (!open || !videoId) return;
    return observeComments(videoId, (list) => {
      setComments(list);
      // Drop optimistic rows once the real ones arrive.
      setPending((p) => p.filter((c) => !list.some((r) => r.text === c.text && r.userId === c.userId)));
    });
  }, [open, videoId]);

  const shown = [...pending, ...comments];
  const total = shown.length || count;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!requireAuth("comment")) return;
    if (!uid) return;
    setSending(true);
    try {
      await addComment({
        videoId,
        userId: uid,
        username: user?.username ?? "player",
        photoURL: user?.avatarUrl ?? "",
        text,
      });
      setDraft("");
    } catch {
      toast("Couldn't post your comment. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[72svh] max-w-lg flex-col rounded-t-3xl border-border bg-surface p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold">
            {compactNumber(total)} comments
          </SheetTitle>
        </SheetHeader>

        {comments.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <EmptyState
              icon={MessageSquare}
              title="No comments yet"
              description="Comments on this clip will show up here."
            />
          </div>
        ) : (
          <ul className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {comments.map((c) => (
              <li key={c.id} className="flex min-w-0 gap-3">
                {c.photoURL ? (
                  <img
                    src={c.photoURL}
                    alt={c.username}
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-muted-foreground">
                    @{c.username} · {timeAgo(millisOf(c.createdAt))}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="safe-bottom flex items-center gap-2 border-t border-border px-4 py-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="h-11 rounded-full border-border bg-surface-2"
          />
          <button
            aria-label="Send comment"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
