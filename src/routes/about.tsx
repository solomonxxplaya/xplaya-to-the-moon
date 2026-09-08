import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Shield, LifeBuoy } from "lucide-react";
import { Wordmark } from "@/components/xplaya/Wordmark";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About XPLAYA" },
      {
        name: "description",
        content: "About XPLAYA — the social platform for gamers and creators.",
      },
      { property: "og:title", content: "About XPLAYA" },
      {
        property: "og:description",
        content: "Learn about XPLAYA, terms, privacy and support.",
      },
    ],
  }),
  component: AboutScreen,
});

function Row({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof FileText;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
    </div>
  );
}

function AboutScreen() {
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
        <h1 className="display-title truncate text-2xl">About XPLAYA</h1>
      </header>

      <div className="px-5 pt-8">
        <div className="flex flex-col items-center gap-3">
          <Wordmark className="text-3xl" tagline />
          <p className="text-xs text-muted-foreground">Version 0.1 — foundation build</p>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          XPLAYA is a social platform for gamers and creators: vertical clips,
          tournaments, live streams and a progression system that rewards the players
          who show up. This build focuses on the product experience — the economy,
          streaming and payment layers are prepared but not yet active.
        </p>

        <div className="surface-panel mt-6 divide-y divide-border overflow-hidden rounded-3xl">
          <Row icon={FileText} label="Terms of Service" hint="Published before public launch" />
          <Row icon={Shield} label="Privacy Policy" hint="Published before public launch" />
          <Row icon={LifeBuoy} label="Support" hint="Available from the support screen" />
        </div>
      </div>
    </div>
  );
}
