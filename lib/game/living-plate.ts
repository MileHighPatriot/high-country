import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type { GameState, LocationTag, Season, Weather } from "@/lib/game/types";

/** One diegetic motion tell over a still plate. Never stack these. */
export const LIVING_TELLS = ["snow", "ember", "wind", "water", "air"] as const;
export type LivingTell = (typeof LIVING_TELLS)[number];

export interface LivingPlateContext {
  season: Season;
  weather: Weather;
  locationId: string;
  tags?: readonly LocationTag[];
  campfire?: boolean;
}

const WATER_IDS = new Set([
  "creek",
  "frozen-fall",
  "hot-spring",
  "beaver-meadow",
  "elk-wallow",
]);

/** Trail / meadow / timber / saddle — lean when weather is not already speaking. */
const WIND_IDS = new Set([
  "timberline",
  "burned-timber",
  "lightning-pine",
  "wind-saddle",
  "south-pass",
  "south-park-rim",
  "arapaho-ground",
  "avalanche-chute",
  "grizzly-basin",
  "elk-wallow",
  "beaver-meadow",
]);

export function livingTellFromContext(ctx: LivingPlateContext): LivingTell {
  const tags = ctx.tags ?? LOCATION_BY_ID[ctx.locationId]?.tags ?? [];
  const snowWeather = ctx.weather === "snow" || ctx.weather === "blizzard";
  const waterGround = tags.includes("water") || WATER_IDS.has(ctx.locationId);
  const windWeather = ctx.weather === "wind" || ctx.weather === "storm";
  const windGround = windWeather || WIND_IDS.has(ctx.locationId);

  if (snowWeather) return "snow";
  if (ctx.campfire) return "ember";
  if (ctx.season === "winter") return "snow";
  if (waterGround) return "water";
  if (windGround) return "wind";
  return "air";
}

export function livingTellFromState(state: GameState): LivingTell {
  const loc = LOCATION_BY_ID[state.locationId];
  return livingTellFromContext({
    season: state.season,
    weather: state.weather,
    locationId: state.locationId,
    tags: loc?.tags,
    campfire: state.campfire,
  });
}

export function livingTellFrostsChrome(tell: LivingTell): boolean {
  return tell === "snow";
}
