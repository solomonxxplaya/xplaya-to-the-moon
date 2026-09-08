import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wordmark } from "./Wordmark";

export function AuthGateDialog({
  action,
  onClose,
}: {
  action: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[340px] rounded-3xl border-border bg-surface p-6 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <Wordmark className="text-2xl" />
          <h2 className="text-lg font-semibold">Join XPLAYA to {action}</h2>
          <p className="text-sm text-muted-foreground">
            Create a free account to interact with creators, upload clips and earn XP.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button asChild size="lg" className="w-full rounded-full font-semibold">
              <Link to="/signup" onClick={onClose}>
                Create account
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-transparent"
            >
              <Link to="/login" onClick={onClose}>
                I already have an account
              </Link>
            </Button>
            <button
              onClick={onClose}
              className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Keep browsing as guest
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
