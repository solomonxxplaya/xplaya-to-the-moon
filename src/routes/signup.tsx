import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, AuthDivider, GoogleButton } from "@/components/xplaya/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase/auth-service";
import { initFirebase } from "@/lib/firebase/config";
import { authErrorMessage } from "@/lib/firebase/auth-errors";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — XPLAYA" },
      { name: "description", content: "Create a free XPLAYA account and start earning XP." },
      { property: "og:title", content: "Sign up — XPLAYA" },
      { property: "og:description", content: "Join XPLAYA: watch, play and earn." },
    ],
  }),
  component: SignupScreen,
});

function SignupScreen() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.username.trim()) {
      toast("Choose a username.");
      return;
    }
    if (form.password.length < 6) {
      toast("Use at least 6 characters for your password.");
      return;
    }
    if (form.password !== form.confirm) {
      toast("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await initFirebase();
      await signUpWithEmail({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim(),
      });
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
      title="Create your account"
      subtitle="Watch. Play. Earn. It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-neon">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={update("username")}
            placeholder="yourhandle"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@xplaya.gg"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={update("confirm")}
            placeholder="••••••••"
            className="h-12 rounded-2xl border-border bg-surface"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-12 w-full rounded-full font-bold"
        >
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton onClick={() => void onGoogle()} />
    </AuthLayout>
  );
}
