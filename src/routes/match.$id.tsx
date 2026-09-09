import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, ShieldAlert, ShieldCheck, Swords } from "lucide-react";
import { Screen, SectionHeading } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { gameById, isTournamentStaff, matchStatusLabels } from "@/lib/tournament/config";
import {
  confirmMatchResult,
  disputeMatchResult,
  getMatch,
  listMatchResults,
  submitMatchResult,
  useAsync,
  verifyMatchResult,
} from "@/lib/tournament/service";
import type { MatchDoc, MatchResultDoc } from "@/lib/tournament/model";
import { uploadMedia } from "@/lib/r2/media";
import { toast } from "sonner";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Match — XPLAYA" },
      {
        name: "description",
        content: "Submit your match result with screenshot evidence and get it verified on XPLAYA.",
      },
      { property: "og:title", content: "Match — XPLAYA" },
      {
        property: "og:description",
        content: "Result submission, confirmation, disputes and moderator verification.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MatchDetail,
});

function MatchDetail() {
  const { id } = useParams({ from: "/match/$id" });
  const { uid, role, requireAuth } = useAuth();
  const staff = isTournamentStaff(role);

  const loadMatch = useCallback(() => getMatch(id), [id]);
  const loadResults = useCallback(() => listMatchResults(id), [id]);
  const { data: match, loading } = useAsync<MatchDoc | null>(loadMatch, [id], null);
  const { data: results, refresh } = useAsync<MatchResultDoc[]>(loadResults, [id], []);

  const [outcome, setOutcome] = useState<"win" | "loss">("win");
  const [placement, setPlacement] = useState("");
  const [kills, setKills] = useState("");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="grid h-[70svh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 pt-16 pb-24">
        <EmptyState
          icon={ShieldAlert}
          title="Match not found"
          description="This match no longer exists on XPLAYA."
          action={
            <Button asChild variant="outline" className="rounded-full border-border bg-transparent">
              <Link to="/tournament">Back to tournaments</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isParticipant = Boolean(uid && match.participantIds.includes(uid));
  const mine = results.find((r) => r.submittedBy === uid);

  const addEvidence = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadMedia(file, "media");
      setEvidence((list) => [...list, up.url]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!requireAuth("submit a match result")) return;
    if (!uid) return;
    if (!evidence.length) {
      toast.error("Add at least one screenshot as evidence.");
      return;
    }
    setBusy(true);
    try {
      await submitMatchResult({
        matchId: match.id,
        submittedBy: uid,
        outcome,
        ...(placement ? { placement: Number(placement) } : {}),
        ...(kills ? { kills: Number(kills) } : {}),
        evidenceUrls: evidence,
        ...(note ? { note } : {}),
      });
      toast.success("Result submitted. It stays unverified until confirmed.");
      setEvidence([]);
      setNote("");
      refresh();
    } catch {
      toast.error("Could not submit this result.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
      refresh();
    } catch {
      toast.error("That action was not allowed.");
    } finally {
      setBusy(false);
    }
  };

  const game = gameById(match.game);

  return (
    <Screen title="Match" subtitle={`${game?.name ?? match.game} · ${match.format}`}>
      <Link
        to="/tournament/my"
        className="press mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> My competitions
      </Link>

      <div className="surface-panel flex items-center gap-3 rounded-3xl p-4">
        <Swords className="h-5 w-5 text-neon" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {match.round ? `Round ${match.round}` : "Match"} · {match.mode}
          </p>
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {matchStatusLabels[match.status]} · {match.rule} · {match.level}
          </p>
        </div>
      </div>

      {isParticipant && !mine ? (
        <section className="mt-6">
          <SectionHeading>Submit your result</SectionHeading>
          <div className="surface-panel grid gap-3 rounded-3xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {(["win", "loss"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`press rounded-full py-2 text-[11px] font-bold tracking-[0.14em] uppercase ${
                    outcome === o
                      ? "bg-neon text-primary-foreground"
                      : "border border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={placement}
                onChange={(e) => setPlacement(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="Placement"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
              <input
                value={kills}
                onChange={(e) => setKills(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="Kills"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Note for the moderator (optional)"
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            />

            <label className="press flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface py-3 text-xs font-semibold text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
              {evidence.length ? `${evidence.length} screenshot(s) attached` : "Add screenshot evidence"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void addEvidence(e.target.files?.[0])}
              />
            </label>

            <Button className="rounded-full" disabled={busy} onClick={() => void submit()}>
              {busy ? "Working…" : "Submit result"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <SectionHeading>Submitted results</SectionHeading>
        {results.length ? (
          <div className="grid gap-2.5">
            {results.map((r) => (
              <div key={r.id} className="surface-panel rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase">{r.outcome}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] uppercase ${
                      r.verifiedBy
                        ? "bg-neon text-primary-foreground"
                        : r.disputedBy?.length
                          ? "border border-border bg-surface text-foreground"
                          : "border border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    {r.verifiedBy ? "Verified" : r.disputedBy?.length ? "Disputed" : "Unverified"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {r.placement ? `Place ${r.placement} · ` : ""}
                  {r.kills != null ? `${r.kills} kills · ` : ""}
                  {r.confirmedBy?.length ?? 0} confirmed
                </p>
                {r.note ? <p className="mt-2 text-xs text-muted-foreground">{r.note}</p> : null}
                {r.evidenceUrls.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {r.evidenceUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Match evidence screenshot"
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {isParticipant && r.submittedBy !== uid && !r.verifiedBy ? (
                    <>
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={busy}
                        onClick={() => void act(() => confirmMatchResult(r, uid!), "Result confirmed.")}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={busy}
                        onClick={() => void act(() => disputeMatchResult(r, uid!), "Result disputed.")}
                      >
                        Dispute
                      </Button>
                    </>
                  ) : null}
                  {staff && !r.verifiedBy ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto rounded-full border-neon/60 text-neon"
                      disabled={busy}
                      onClick={() => void act(() => verifyMatchResult(r, uid!), "Result verified.")}
                    >
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verify
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldAlert}
            title="No results submitted"
            description="Nothing is assumed automatically — a result only counts once submitted, confirmed or verified."
          />
        )}
      </section>
    </Screen>
  );
}
