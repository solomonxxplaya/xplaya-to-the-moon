import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Screen, FilterChips, ComingSoonNote, ComingSoonBanner } from "@/components/layout/Screen";
import { shopCategories } from "@/lib/ui-options";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — XPLAYA" },
      {
        name: "description",
        content: "XP boosters, video promotion and cosmetics in the XPLAYA shop.",
      },
      { property: "og:title", content: "Shop — XPLAYA" },
      {
        property: "og:description",
        content: "XP boosters, video promotion and cosmetics for XPLAYA creators.",
      },
    ],
  }),
  component: ShopScreen,
});

function ShopScreen() {
  const [category, setCategory] = useState("All");

  return (
    <Screen title="Shop" subtitle="Boost your XP and your reach">
      <ComingSoonBanner>Purchases are not available yet — this is a preview of the experience.</ComingSoonBanner>

      <FilterChips options={shopCategories} value={category} onChange={setCategory} />

      <div className="surface-panel mt-4 grid place-items-center gap-2 rounded-3xl px-6 py-14 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">The shop is empty</p>
        <p className="text-xs text-muted-foreground">
          XP boosters, promotion and cosmetics will be listed here once the store opens.
        </p>
      </div>

      <div className="mt-4">
        <ComingSoonNote>
          Purchases are disabled. Payments will be enabled in a later phase.
        </ComingSoonNote>
      </div>
    </Screen>
  );
}
