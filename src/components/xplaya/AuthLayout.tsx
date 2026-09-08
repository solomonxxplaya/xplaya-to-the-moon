import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Wordmark } from "./Wordmark";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-5 pt-4 pb-24">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-[110px]"
        style={{ background: "oklch(0.86 0.24 145 / 16%)" }}
      />
      <Link
        to="/"
        aria-label="Back to feed"
        className="relative grid h-10 w-10 place-items-center rounded-full bg-surface"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>

      <div className="relative mt-8">
        <Wordmark className="text-3xl" tagline />
      </div>

      <div className="relative mt-10">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6 space-y-4">{children}</div>
      </div>

      <div className="relative mt-8 text-center text-sm text-muted-foreground">
        {footer}
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface text-sm font-semibold"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 16.1 7l2.7-2.6A9.9 9.9 0 1 0 12 22c5.7 0 9.5-4 9.5-9.6 0-.7-.1-1.3-.2-1.9H12z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] tracking-widest text-muted-foreground uppercase">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
