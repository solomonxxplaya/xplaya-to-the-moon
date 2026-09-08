import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  UserPlus,
  CreditCard,
  Info,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Bell,
  PlayCircle,
  Gauge,
  Moon,
  Zap,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePrefs } from "@/lib/prefs";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — XPLAYA" },
      { name: "description", content: "Manage your XPLAYA account, invites and support." },
      { property: "og:title", content: "Settings — XPLAYA" },
      { property: "og:description", content: "Account, invites, support and about XPLAYA." },
    ],
  }),
  component: SettingsScreen,
});

function RowShell({
  icon: Icon,
  label,
  hint,
  danger,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
  danger?: boolean | undefined;
  trailing: React.ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2",
          danger ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-medium", danger && "text-destructive")}>
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {trailing}
    </>
  );
}

function LinkRow({
  icon,
  label,
  hint,
  to,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
  to: string;
}) {
  return (
    <Link to={to} className="flex w-full items-center gap-3 px-4 py-4 text-left">
      <RowShell
        icon={icon}
        label={label}
        hint={hint}
        trailing={<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      />
    </Link>
  );
}

function ButtonRow({
  icon,
  label,
  hint,
  onClick,
  disabled,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  danger?: boolean | undefined;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:opacity-50"
    >
      <RowShell
        icon={icon}
        label={label}
        hint={hint}
        danger={danger}
        trailing={
          disabled ? (
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Soon
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        }
      />
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
  checked: boolean;
  onCheckedChange?: ((v: boolean) => void) | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-4">
      <RowShell
        icon={icon}
        label={label}
        hint={hint}
        trailing={
          <Switch
            checked={checked}
            {...(onCheckedChange ? { onCheckedChange } : {})}
            disabled={Boolean(disabled)}
            aria-label={label}
            className="shrink-0"
          />
        }
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

function SettingsScreen() {
  const { isAuthenticated, requireAuth, signOut, isAdmin } = useAuth();
  const { showXpOnHome, setShowXpOnHome } = usePrefs();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

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
        <h1 className="display-title truncate text-2xl">Settings</h1>
      </header>

      <div className="px-5 pt-3">
        <SectionTitle>Account</SectionTitle>
        <div className="surface-panel divide-y divide-border overflow-hidden rounded-3xl">
          <LinkRow
            icon={User}
            label="Edit profile"
            hint="Photo, username, display name and bio"
            to="/edit-profile"
          />
          <ButtonRow
            icon={CreditCard}
            label="Password & security"
            hint={isAuthenticated ? "Change password and sessions" : "Sign in to manage"}
            onClick={() => requireAuth("manage your security settings")}
          />
        </div>

        <SectionTitle>XPLAYA</SectionTitle>
        <div className="surface-panel divide-y divide-border overflow-hidden rounded-3xl">
          <LinkRow
            icon={UserPlus}
            label="Invite friends"
            hint="Share your XPLAYA invite link"
            to="/invite"
          />
          <ButtonRow icon={CreditCard} label="Payment" hint="Coming soon" disabled />
          <LinkRow
            icon={Info}
            label="About XPLAYA"
            hint="Watch. Play. Earn. — v0.1"
            to="/about"
          />
          <LinkRow
            icon={LifeBuoy}
            label="Support"
            hint="Report a problem or get help"
            to="/support"
          />
        </div>

        {isAdmin ? (
          <>
            <SectionTitle>Moderation</SectionTitle>
            <div className="surface-panel divide-y divide-border overflow-hidden rounded-3xl">
              <LinkRow
                icon={ShieldCheck}
                label="Admin Panel"
                hint="Users, clips and reports"
                to="/admin"
              />
            </div>
          </>
        ) : null}

        <SectionTitle>Preferences</SectionTitle>
        <div className="surface-panel divide-y divide-border overflow-hidden rounded-3xl">
          <ToggleRow
            icon={Bell}
            label="Notifications"
            hint="Likes, comments and tournament alerts"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
          <ToggleRow
            icon={Zap}
            label="Show XP & Level on Home"
            hint="Small XP and level indicator on the feed"
            checked={showXpOnHome}
            onCheckedChange={setShowXpOnHome}
          />
          <ToggleRow
            icon={PlayCircle}
            label="Autoplay"
            hint="Play clips automatically in the feed"
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
          <ToggleRow
            icon={Gauge}
            label="Data saver"
            hint="Lower video quality on mobile data"
            checked={dataSaver}
            onCheckedChange={setDataSaver}
          />
          <ToggleRow
            icon={Moon}
            label="Dark mode"
            hint="XPLAYA is dark by default"
            checked
            disabled
          />
        </div>

        <div className="surface-panel mt-6 overflow-hidden rounded-3xl">
          <ButtonRow
            icon={LogOut}
            label="Log out"
            danger
            onClick={() => {
              if (!isAuthenticated) {
                requireAuth("log out");
                return;
              }
              setLogoutOpen(true);
            }}
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Not signed in?{" "}
          <Link to="/login" className="font-semibold text-neon">
            Log in
          </Link>{" "}
          or{" "}
          <Link to="/signup" className="font-semibold text-neon">
            create an account
          </Link>
          .
        </p>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl border-border bg-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of XPLAYA?</AlertDialogTitle>
            <AlertDialogDescription>
              You can keep browsing as a guest after logging out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-border bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                signOut();
                toast("You've been logged out.");
              }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
