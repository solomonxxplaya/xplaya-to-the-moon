import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, AuthDivider, GoogleButton } from "@/components/xplaya/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth-service";
import { initFirebase } from "@/lib/firebase/config";
import { authErrorMessage } from "@/lib/firebase/auth-errors";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — XPLAYA" },
      { name: "description", content: "Log in to your XPLAYA account." },
      { property: "og:title", content: "Log in — XPLAYA" },
      { property: "og:description", content: "Access your XPLAYA player profile." },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await initFirebase();
      await signInWithEmail(email.trim(), password);
      void navigate({ to: "/me" });
    } catch (error) {
      toast(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      await initFirebase();
      await signInWithGoogle();
      void navigate({ to: "/me" });
    } catch (error) {
      toast(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep earning XP and climbing ranks."
      footer={
        <>
          New to XPLAYA?{" "}
          <Link to="/signup" className="font-semibold text-neon">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@xplaya.gg"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-neon">
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-12 w-full rounded-full font-bold"
        >
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton onClick={() => void onGoogle()} />
    </AuthLayout>
  );
}
