import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const reasons = [
  "Spam",
  "Harassment",
  "Inappropriate content",
  "Copyright",
  "Other",
];

export function ReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[340px] rounded-3xl border-border bg-surface p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Report content</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Tell us what's wrong. Reports are reviewed by the XPLAYA team.
        </p>
        <div className="mt-2 space-y-2">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                reason === r
                  ? "border-neon/60 bg-neon/10 text-neon"
                  : "border-border bg-surface-2 text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <Button
          className="mt-3 h-11 w-full rounded-full font-semibold"
          disabled={!reason}
          onClick={() => {
            onOpenChange(false);
            setReason(null);
            toast("Thanks. Your report has been received.");
          }}
        >
          Submit report
        </Button>
      </DialogContent>
    </Dialog>
  );
}
