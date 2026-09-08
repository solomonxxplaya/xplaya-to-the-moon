import { Copy, Link2, Send, Flag, EyeOff } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

function Option({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 py-2 text-center"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface-2">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}

export function ShareSheet({
  open,
  onOpenChange,
  shareUrl,
  onReport,
  onShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onReport: () => void;
  /** Called with the channel once a real share happened, so it can be counted. */
  onShared?: (channel: string) => void;
}) {
  const close = () => onOpenChange(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      onShared?.("link");
      toast("Link copied");
    } catch {
      toast("Couldn't copy the link. Try again.");
    }
    close();
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "XPLAYA", url: shareUrl });
        onShared?.("native");
      } catch {
        /* dismissed */
      }
    } else {
      await copy();
    }
    close();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-3xl border-border bg-surface p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold">Share</SheetTitle>
        </SheetHeader>
        <div className="safe-bottom grid grid-cols-4 gap-2 px-4 py-5">
          <Option icon={Copy} label="Copy link" onClick={copy} />
          <Option icon={Send} label="Share to" onClick={nativeShare} />
          <Option
            icon={EyeOff}
            label="Not interested"
            onClick={() => {
              toast("We'll show fewer clips like this.");
              close();
            }}
          />
          <Option
            icon={Flag}
            label="Report"
            onClick={() => {
              close();
              onReport();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { Link2 };
