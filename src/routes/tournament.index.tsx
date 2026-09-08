import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Screen, ComingSoonNote } from "@/components/layout/Screen";
import { EmptyState } from "@/components/xplaya/EmptyState";

export const Route = createFileRoute("/tournament/")({
  head: () => ({
    meta: [
      { title: "Tournaments — XPLAYA" },
      {
        name: "description",
        content: "Browse upcoming, live and completed XPLAYA gaming tournaments.",
      },
      { property: "og:title", content: "Tournaments — XPLAYA" },
      {
        property: "og:description",
        content: "Upcoming, live and completed XPLAYA gaming tournaments.",
      },
    ],
  }),
  component: TournamentScreen,
});

function TournamentScreen() {
  return (
    <Screen title="Tournaments" subtitle="Compete for prizes and XP">
      <div className="pt-10">
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Tournament registration, brackets and scoring are not live yet. When the first XPLAYA tournament opens, it will appear here."
        />
        <ComingSoonNote>
          Tournaments are being built — nothing shown here is simulated, so an empty board means
          no events are open right now.
        </ComingSoonNote>
      </div>
    </Screen>
  );
}
