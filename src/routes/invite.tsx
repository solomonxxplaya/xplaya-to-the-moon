import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gift, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoonNote } from "@/components/layout/Screen";
import { toast } from "sonner";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Invite friends — XPLAYA" },
      { name: "description", content: "Invite friends to XPLAYA and grow your squad." },
      { property: "og:title", content: "Invite friends — XPLAYA" },
      { property: "og:description", content: "Share your XPLAYA invite link with friends." },
    ],
  }),
  component: InviteScreen,
});

const inviteLink = "https://xplaya.app/i/xplaya";

function InviteScreen() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast("Invite link copied");
    } catch {
      toast("Couldn't copy the link. Try again.");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Join me on XPLAYA", url: inviteLink });
        return;
      } catch {
        /* dismissed */
      }
    }
    await copy();
  };

  return (
    <div className="mx-auto w-full max-w-lg pb-24">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
        <Link
          to="/settings"
          aria-label="Back to settings"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="display-title truncate text-2xl">Invite friends</h1>
      </header>

      <div className="px-5 pt-6">
        <div className="surface-panel rounded-3xl p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon/12 text-neon">
            <Gift className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold">Invite friends to XPLAYA</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your personal link. Anyone who joins through it is linked to your
            account, so referral rewards can be credited once the XP economy goes live.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-3">
            <span className="min-w-0 flex-1 truncate text-left text-xs text-muted-foreground">
              {inviteLink}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="h-12 flex-1 rounded-full font-semibold" onClick={copy}>
              <Copy className="h-4 w-4" /> Copy link
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-full border-border bg-transparent"
              onClick={share}
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <ComingSoonNote>
            Referral rewards are not active yet — invites are tracked once accounts are
            connected.
          </ComingSoonNote>
        </div>
      </div>
    </div>
  );
}
