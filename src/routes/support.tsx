import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Flag,
  Mail,
  UserCog,
  UploadCloud,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — XPLAYA" },
      { name: "description", content: "Get help with your XPLAYA account, uploads and more." },
      { property: "og:title", content: "Support — XPLAYA" },
      { property: "og:description", content: "Help center, reporting and contact options." },
    ],
  }),
  component: SupportScreen,
});

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:opacity-50"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? (
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {disabled ? (
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Soon
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

function SupportScreen() {
  const notYet = () => toast("Support requests open when accounts go live.");

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
        <h1 className="display-title truncate text-2xl">Support</h1>
      </header>

      <div className="px-5 pt-5">
        <div className="surface-panel divide-y divide-border overflow-hidden rounded-3xl">
          <Row icon={BookOpen} label="Help center" hint="Guides and FAQs" onClick={notYet} />
          <Row icon={Flag} label="Report a problem" hint="Bugs and broken screens" onClick={notYet} />
          <Row icon={Mail} label="Contact support" hint="Reply within 48 hours" onClick={notYet} />
          <Row icon={UserCog} label="Account issues" hint="Login, username, recovery" onClick={notYet} />
          <Row icon={UploadCloud} label="Upload issues" hint="Processing and publishing" onClick={notYet} />
          <Row icon={CreditCard} label="Payment issues" hint="Coming soon" disabled />
        </div>
      </div>
    </div>
  );
}
