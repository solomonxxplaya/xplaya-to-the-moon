import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Trophy, Radio, Plus, ShoppingBag, Bell, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournament", label: "Tournament", icon: Trophy },
  { to: "/live", label: "Live", icon: Radio },
  { to: "/upload", label: "Upload", icon: Plus },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/inbox", label: "Inbox", icon: Bell },
  { to: "/me", label: "Me", icon: User },
];

const hiddenOn = ["/login", "/signup", "/forgot-password"];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (hiddenOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-2xl">
      <ul className="mx-auto grid w-full max-w-lg grid-cols-7 px-1 pt-2 pb-1.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isUpload = to === "/upload";
          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-label={label}
                className="press flex min-h-[52px] flex-col items-center justify-center gap-1.5 px-0.5"
              >
                {isUpload ? (
                  <span
                    className={cn(
                      "neon-ring grid h-7 w-9 place-items-center rounded-md bg-neon text-primary-foreground transition-transform",
                      active && "scale-105",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={3} />
                  </span>
                ) : (
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-colors",
                      active ? "text-neon" : "text-muted-foreground",
                    )}
                    strokeWidth={active ? 2.3 : 1.8}
                  />
                )}
                <span
                  className={cn(
                    "w-full truncate text-center text-[7px] leading-none font-bold tracking-[-0.02em] uppercase transition-colors",
                    active ? "text-neon" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
