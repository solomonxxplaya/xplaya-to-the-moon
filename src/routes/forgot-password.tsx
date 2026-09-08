import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/xplaya/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendReset } from "@/lib/firebase/auth-service";
import { initFirebase } from "@/lib/firebase/config";
import { authErrorMessage } from "@/lib/firebase/auth-errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — XPLAYA" },
      { name: "description", content: "Reset the password for your XPLAYA account." },
      { property: "og:title", content: "Reset password — XPLAYA" },
      { property: "og:description", content: "Recover access to your XPLAYA account." },
    ],
  }),
  component: ForgotPasswordScreen,
});

function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast("Enter your email address.");
      return;
    }
    setBusy(true);
    try {
      await initFirebase();
      await sendReset(email.trim());
      toast("Reset link sent. Check your inbox.");
    } catch (error) {
      toast(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We'll send a reset link to your email address."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-neon">
            Back to login
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
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-12 w-full rounded-full font-bold"
        >
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
