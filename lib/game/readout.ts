import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { skillStatusLine } from "@/lib/game/progress";
import type {
  DeathCause,
  GameState,
  LocationId,
  Meters,
  Season,
  Trait,
} from "@/lib/game/types";

/** How many journal beats the save keeps. Opening line is never dropped. */
export const JOURNAL_KEEP = 40;

export const METER_LABELS: Record<keyof Meters, string> = {
  hunger: "Belly",
  thirst: "Water",
  warmth: "Warmth",
  energy: "Strength",
  health: "Health",
};

export const TRAIT_BLURB: Record<Trait, string> = {
  eye: "Eye — see, aim, notice",
  grit: "Grit — hold still, endure",
  savvy: "Savvy — read country and people",
  hands: "Hands — make, mend, climb",
};

export const TRAIT_LINE = "Eye see · Grit endure · Savvy read · Hands make";

export function placeName(id: LocationId | undefined): string {
  if (!id) return "the mountain";
  return LOCATION_BY_ID[id]?.name ?? id;
}

export function deathCauseLabel(cause: DeathCause): string {
  return {
    starvation: "starved",
    thirst: "thirst",
    exposure: "the cold",
    exhaustion: "gave out",
    violence: "killed",
    accident: "a fall",
    sickness: "fever",
  }[cause];
}

export function deathSentence(cause: DeathCause, locationId?: LocationId): string {
  const here = placeName(locationId);
  switch (cause) {
    case "starvation":
      return `You went hollow at ${here}. The last thing you tasted was pine smoke and want.`;
    case "thirst":
      return `Your tongue cracked at ${here}. The creek was a rumor you could no longer reach.`;
    case "exposure":
      return `The cold finished you at ${here}, the work it started the first night you slept without a fire.`;
    case "exhaustion":
      return `You sat down to rest at ${here} and the mountain accepted the offering.`;
    case "violence":
      return `Someone — or something — was quicker, at ${here}.`;
    case "accident":
      return `Ice, rock, or bad luck at ${here}. The mountain does not file reports.`;
    case "sickness":
      return `Fever took the hours you needed at ${here}.`;
  }
}

/** Hours to walk an edge from here, matching travel() in the engine. */
export function trailHours(state: GameState, base: number): number {
  let hours = base;
  if (state.weather === "snow") hours += 1;
  if (state.weather === "blizzard") hours += 2;
  if (state.season === "winter") hours += 1;
  if (state.hour < 6 || state.hour >= 20) hours += 1;
  if (
    state.inventory.extras.includes("snowshoes") &&
    (state.season === "winter" || state.weather === "snow" || state.weather === "blizzard")
  ) {
    hours = Math.max(base, hours - 1);
  }
  return hours;
}

export function trailDestName(state: GameState, to: LocationId): string {
  if (state.camp?.locationId === to) return "Your camp";
  if (state.knownLocations.includes(to)) return placeName(to);
  return "Unnamed trail";
}

export function trailChip(
  state: GameState,
  edge: { to: LocationId; hours: number; trailName: string },
): string {
  return `${trailDestName(state, edge.to)} · ${trailHours(state, edge.hours)} hr`;
}

export type MapTrail = {
  to: LocationId;
  name: string;
  hours: number;
  known: boolean;
  trailName: string;
};

export type MapNode = {
  id: LocationId;
  name: string;
  here: boolean;
  camp: boolean;
  trails: MapTrail[];
};

/** Places the run has named. Cursor should draw this, not invent a second list. */
export function knownMap(state: GameState): MapNode[] {
  return state.knownLocations.map((id) => {
    const loc = LOCATION_BY_ID[id];
    return {
      id,
      name: loc?.name ?? id,
      here: state.locationId === id,
      camp: state.camp?.locationId === id,
      trails: (loc?.connections ?? []).map((c) => ({
        to: c.to,
        name: state.knownLocations.includes(c.to) ? placeName(c.to) : "Unnamed trail",
        hours: trailHours(state, c.hours),
        known: state.knownLocations.includes(c.to),
        trailName: c.trailName,
      })),
    };
  });
}

export function seasonShort(season: Season): string {
  return { spring: "thaw", summer: "high summer", fall: "fall hunt", winter: "deep winter" }[season];
}

export { skillStatusLine };
