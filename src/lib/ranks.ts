/**
 * XPLAYA rank system — single source of truth for the ladder, the artwork and
 * the progression maths.
 *
 * Ladder: Bronze -> Silver -> Gold -> Platinum -> Diamond -> Hero ->
 *         Elite Hero -> Master -> Grandmaster -> Legend
 *
 * Every tier except Legend has five levels (I–V). Legend is a single rank.
 */
import { rankTierNames, type RankLevel, type RankTier, type RankTierName } from "./types";

import bronzeArt from "@/assets/ranks/bronze.png";
import silverArt from "@/assets/ranks/silver.png";
import goldArt from "@/assets/ranks/gold.png";
import platinumArt from "@/assets/ranks/platinum.png";
import diamondArt from "@/assets/ranks/diamond.png";
import heroArt from "@/assets/ranks/hero.png";
import eliteHeroArt from "@/assets/ranks/elite-hero.png";
import masterArt from "@/assets/ranks/master.png";
import grandmasterArt from "@/assets/ranks/grandmaster.png";
import legendArt from "@/assets/ranks/legend.png";

/** Full rank artwork per tier. Always rendered complete (never cropped). */
export const rankArt: Record<RankTierName, string> = {
  Bronze: bronzeArt,
  Silver: silverArt,
  Gold: goldArt,
  Platinum: platinumArt,
  Diamond: diamondArt,
  Hero: heroArt,
  "Elite Hero": eliteHeroArt,
  Master: masterArt,
  Grandmaster: grandmasterArt,
  Legend: legendArt,
};

/** Accent colour per tier, matching the artwork. */
export const rankAccent: Record<RankTierName, string> = {
  Bronze: "#d59a5c",
  Silver: "#dbe6f0",
  Gold: "#ffd64f",
  Platinum: "#7ef0dd",
  Diamond: "#5ab6ff",
  Hero: "#ff5a5a",
  "Elite Hero": "#ff7a2f",
  Master: "#ffcf3d",
  Grandmaster: "#ffb01f",
  Legend: "#fff3c4",
};

export const rankLevels: readonly RankLevel[] = ["I", "II", "III", "IV", "V"];

/** Legend has no levels. */
export const hasLevels = (tier: RankTierName) => tier !== "Legend";

const tierByLength = [...rankTierNames].sort((a, b) => b.length - a.length);

export function splitRank(rank: RankTier): { tier: RankTierName; level: RankLevel | null } {
  const tier = tierByLength.find((t) => rank.startsWith(t)) ?? "Bronze";
  const rest = rank.slice(tier.length).trim() as RankLevel | "";
  return { tier, level: rest && hasLevels(tier) ? rest : null };
}

/** The rank a player climbs to next, or null at the top of the ladder. */
export function nextRank(rank: RankTier): RankTier | null {
  const { tier, level } = splitRank(rank);
  if (tier === "Legend") return null;
  if (level) {
    const idx = rankLevels.indexOf(level);
    if (idx >= 0 && idx < rankLevels.length - 1) {
      return `${tier} ${rankLevels[idx + 1]}` as RankTier;
    }
  }
  const next = rankTierNames[rankTierNames.indexOf(tier) + 1];
  if (!next) return null;
  return hasLevels(next) ? (`${next} I` as RankTier) : next;
}

/** The full ladder as displayed in the Rank View. */
export const rankLadder: { tier: RankTierName; ranks: RankTier[] }[] = rankTierNames.map(
  (tier) => ({
    tier,
    ranks: hasLevels(tier)
      ? rankLevels.map((l) => `${tier} ${l}` as RankTier)
      : ([tier] as RankTier[]),
  }),
);

/** Flat ordered list of every rank on the ladder. */
export const allRanks: RankTier[] = rankLadder.flatMap((group) => group.ranks);

export const rankIndex = (rank: RankTier) => {
  const { tier, level } = splitRank(rank);
  const normalised = (level ? `${tier} ${level}` : tier) as RankTier;
  const idx = allRanks.indexOf(normalised);
  return idx === -1 ? 0 : idx;
};

export const formatRank = (rank: RankTier) => {
  const { tier, level } = splitRank(rank);
  return level ? `${tier} ${level}` : tier;
};
