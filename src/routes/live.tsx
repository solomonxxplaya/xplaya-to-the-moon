import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Radio } from "lucide-react";
import { Screen, FilterChips, ComingSoonNote, ComingSoonBanner } from "@/components/layout/Screen";
import { liveCategories } from "@/lib/ui-options";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live — XPLAYA" },
      { name: "description", content: "Watch XPLAYA creators streaming live right now." },
      { property: "og:title", content: "Live — XPLAYA" },
      { property: "og:description", content: "XPLAYA creators streaming live right now." },
    ],
  }),
  component: LiveScreen,
});

function LiveScreen() {
  const [category, setCategory] = useState("All");

  return (
    <Screen title="Live" subtitle="Streams from the XPLAYA community">
      <ComingSoonBanner>Live streaming is not available yet — this is a preview of the experience.</ComingSoonBanner>

      <FilterChips options={liveCategories} value={category} onChange={setCategory} />

      <div className="mt-4 space-y-4">
        <div className="surface-panel grid place-items-center gap-2 rounded-3xl px-6 py-14 text-center">
          <Radio className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">No live streams</p>
          <p className="text-xs text-muted-foreground">
            XPLAYA Live is not switched on yet. Streams will appear here once it launches.
          </p>
        </div>

        <ComingSoonNote>Real streaming playback is not connected yet.</ComingSoonNote>
      </div>
    </Screen>
  );
}
