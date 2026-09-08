import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/xplaya/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tournament/$id")({
  head: () => ({
    meta: [
      { title: "Tournament — XPLAYA" },
      {
        name: "description",
        content: "Prize pool, entry, rules and rewards for this XPLAYA tournament.",
      },
      { property: "og:title", content: "Tournament — XPLAYA" },
      {
        property: "og:description",
        content: "Prize pool, entry requirements, rules and rewards on XPLAYA.",
      },
    ],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  // There is no tournament backend yet — every id is honestly "not found".
  return (
    <div className="mx-auto w-full max-w-lg px-5 pt-16 pb-24">
      <EmptyState
        icon={ShieldAlert}
        title="Tournament not found"
        description="Tournaments are not live yet. When they launch, event details will appear here."
        action={
          <Button asChild variant="outline" className="rounded-full border-border bg-transparent">
            <Link to="/tournament">Back to tournaments</Link>
          </Button>
        }
      />
    </div>
  );
}
