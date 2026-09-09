import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Swords, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  ENTRY_PLACEHOLDER,
  competitionLevels,
  gameById,
  games,
  type CompetitionLevel,
  type GameId,
} from "@/lib/tournament/config";
import { createMatchRequest } from "@/lib/tournament/service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tournament/find-match")({
  head: () => ({
    meta: [
      { title: "Find a Match — XPLAYA" },
      {
        name: "description",
        content:
          "Choose your game, mode, format, rules and competition level to queue for an XPLAYA match.",
      },
      { property: "og:title", content: "Find a Match — XPLAYA" },
      {
        property: "og:description",
        content: "Queue for a competitive XPLAYA match in four steps.",
      },
    ],
  }),
  component: FindMatch,
});

const steps = ["Game", "Mode", "Format", "Rules", "Level"] as const;

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
        selected
          ? "border-neon bg-neon/10 text-neon"
          : "border-border bg-surface text-foreground hover:border-neon/40",
      )}
    >
      {label}
      {selected ? <Check className="h-4 w-4" /> : null}
    </button>
  );
}

function FindMatch() {
  const { uid, requireAuth } = useAuth();
  const [step, setStep] = useState(0);
  const [game, setGame] = useState<GameId | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [rule, setRule] = useState<string | null>(null);
  const [level, setLevel] = useState<CompetitionLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const cfg = gameById(game);
  const choices: Record<number, { value: string | null; options: string[]; set: (v: string) => void }> =
    {
      0: { value: game, options: games.map((g) => g.name), set: (v) => {
        const found = games.find((g) => g.name === v);
        setGame(found?.id ?? null);
        setMode(null);
        setFormat(null);
        setRule(null);
      } },
      1: { value: mode, options: cfg?.modes ?? [], set: setMode },
      2: { value: format, options: cfg?.formats ?? [], set: setFormat },
      3: { value: rule, options: cfg?.rules ?? [], set: setRule },
      4: {
        value: level,
        options: [...competitionLevels],
        set: (v) => setLevel(v as CompetitionLevel),
      },
    };

  const current = choices[step];
  const currentLabel = step === 0 ? (cfg?.name ?? null) : current.value;
  const complete = game && mode && format && rule && level;

  const submit = async () => {
    if (!uid) {
      requireAuth?.();
      return;
    }
    if (!complete) return;
    setSaving(true);
    try {
      await createMatchRequest({ userId: uid, game, mode, format, rule, level });
      toast.success("Match request queued", {
        description: "You'll be notified when an opponent request matches yours.",
      });
    } catch {
      toast.error("Could not queue your match request. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Find a Match" subtitle="Build your competition">
      <Link
        to="/tournament"
        className="press mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tournament hub
      </Link>

      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => (i === 0 || game ? setStep(i) : null)}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= step ? "bg-neon" : "bg-border",
            )}
            aria-label={s}
          />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        Step {step + 1} of {steps.length} — {steps[step]}
      </p>

      <div className="mt-3 grid gap-2.5">
        {current.options.length ? (
          current.options.map((o) => (
            <OptionRow
              key={o}
              label={o}
              selected={currentLabel === o}
              onClick={() => {
                current.set(o);
                setStep((s) => Math.min(s + 1, steps.length - 1));
              }}
            />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
            Pick a game first.
          </p>
        )}
      </div>

      <div className="surface-panel mt-6 rounded-3xl p-4">
        <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Your selection
        </p>
        <p className="mt-2 text-sm font-semibold">
          {[cfg?.name, mode, format, rule, level].filter(Boolean).join(" · ") || "Nothing selected"}
        </p>
        <p className="mt-3 rounded-full border border-border bg-surface px-3 py-1 text-center text-[9px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          {ENTRY_PLACEHOLDER}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Matchmaking pairs real XPLAYA players only. No opponents are simulated — your request
          stays open until a genuine match is found.
        </p>
        <Button
          onClick={submit}
          disabled={!complete || saving}
          className="mt-4 h-11 w-full rounded-full bg-neon font-bold text-primary-foreground"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Swords className="mr-2 h-4 w-4" /> Queue match request
            </>
          )}
        </Button>
      </div>
    </Screen>
  );
}
