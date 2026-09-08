import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Users, Film, Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { initFirebase } from "@/lib/firebase/config";
import {
  getPlatformStats,
  listReports,
  listUsers,
  setReportStatus,
  setUserRole,
  type PlatformStats,
} from "@/lib/firebase/admin-service";
import type { PublicProfileDoc, ReportDoc, UserRole } from "@/lib/firebase/model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — XPLAYA" },
      { name: "description", content: "XPLAYA moderation and platform administration." },
      { property: "og:title", content: "Admin Panel — XPLAYA" },
      { property: "og:description", content: "Moderate users, clips and reports on XPLAYA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminScreen,
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="surface-panel rounded-2xl p-3">
      <Icon className="h-4 w-4 text-neon" />
      <p className="display-title mt-2 text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

function AdminScreen() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<PublicProfileDoc[]>([]);
  const [reports, setReports] = useState<ReportDoc[]>([]);

  // Direct-URL access is blocked for anyone who is not an admin/owner.
  useEffect(() => {
    if (loading) return;
    if (!isAdmin) void navigate({ to: isAuthenticated ? "/me" : "/login", replace: true });
  }, [loading, isAdmin, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void (async () => {
      await initFirebase();
      const [s, u, r] = await Promise.all([getPlatformStats(), listUsers(), listReports()]);
      if (cancelled) return;
      setStats(s);
      setUsers(u);
      setReports(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="grid h-[80svh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const changeRole = async (uid: string, role: UserRole) => {
    try {
      await setUserRole(uid, role);
      setUsers((list) => list.map((u) => (u.uid === uid ? { ...u, role } : u)));
      toast.success("Role updated.");
    } catch {
      toast.error("You are not allowed to change this role.");
    }
  };

  const resolve = async (report: ReportDoc) => {
    try {
      await setReportStatus(report.id, "resolved");
      setReports((list) =>
        list.map((r) => (r.id === report.id ? { ...r, status: "resolved" } : r)),
      );
    } catch {
      toast.error("Could not update this report.");
    }
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
        <h1 className="display-title truncate text-2xl">Admin Panel</h1>
        <ShieldCheck className="ml-auto h-5 w-5 text-neon" />
      </header>

      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Users} label="Users" value={stats?.users ?? 0} />
          <StatCard icon={Film} label="Clips" value={stats?.videos ?? 0} />
          <StatCard icon={Flag} label="Open reports" value={stats?.openReports ?? 0} />
        </div>

        <Tabs defaultValue="users" className="mt-5">
          <TabsList className="w-full">
            <TabsTrigger value="users" className="flex-1">
              Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-3 space-y-2">
            {users.map((u) => (
              <div
                key={u.uid}
                className="surface-panel flex items-center gap-3 rounded-2xl px-3 py-2.5"
              >
                <img
                  src={u.photoURL}
                  alt={u.displayName}
                  className="h-9 w-9 rounded-full bg-surface-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">@{u.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.role}</p>
                </div>
                {u.role === "admin" || u.role === "owner" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => void changeRole(u.uid, "user")}
                  >
                    Demote
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => void changeRole(u.uid, "admin")}
                  >
                    Make admin
                  </Button>
                )}
              </div>
            ))}
            {users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No users loaded.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="reports" className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="surface-panel rounded-2xl px-3 py-2.5">
                <p className="text-sm font-semibold">
                  {r.targetType} · {r.reason}
                </p>
                <p className="truncate text-xs text-muted-foreground">{r.targetId}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {r.status}
                  </span>
                  {r.status !== "resolved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto rounded-full"
                      onClick={() => void resolve(r)}
                    >
                      Resolve
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {reports.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No reports.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
