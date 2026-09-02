import { emptyCamp } from "@/lib/game/camp";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type { GameState, LocationId, Season } from "@/lib/game/types";

export interface OpeningDef {
  id: string;
  text: (state: GameState) => string;
  apply?: (state: GameState, rng: () => number) => GameState;
  fits?: (loc: LocationId, season: Season, hour: number) => boolean;
}

function place(state: GameState) {
  return LOCATION_BY_ID[state.locationId]?.name ?? "this ground";
}

export const OPENINGS: OpeningDef[] = [
  {
    id: "wake-leak",
    text: (s) =>
      `${s.name} wakes under canvas that leaked all night at ${place(s)}. 1835. Too high on the Front Range. The pass is still a white lie. There is no town coming. Eat. Drink. Keep a fire. Do not die.`,
  },
  {
    id: "creek-iron",
    fits: (loc) => loc === "creek" || loc === "beaver-meadow",
    text: (s) =>
      `You come to yourself on wet stones at ${place(s)}, iron in the mouth, no memory of lying down. ${s.name}, 1835, and the water is louder than your name. Fill the tin. Do not walk the ice. The mountain is already keeping score.`,
  },
  {
    id: "timber-krumm",
    fits: (loc) => loc === "timberline" || loc === "lightning-pine" || loc === "high-camp",
    text: (s) =>
      `Krummholz has your sleeve. Dawn at ${place(s)} is a tin color. ${s.name} is already too high for the season, 1835, Front Range, no road that means a town. The trees here have given up. You have not, which is not the same as wisdom.`,
  },
  {
    id: "wrecked-ring",
    text: (s) =>
      `Someone’s lean-to — yours, or a dead man’s — is a wreck of poles at ${place(s)}. The fire ring is still honest. ${s.name} counts the stones and does not ask who stacked them. 1835. The Front Range does not file forwarding addresses.`,
    apply: (s) => ({
      ...s,
      camp: emptyCamp(s.locationId, {
        fireRing: true,
        leanTo: false,
        smoke: 1,
        cache: { rations: 0, water: 0, firewood: 1, pelts: 0, powder: 0, extras: [] },
      }),
    }),
  },
  {
    id: "wounded-shin",
    text: (s) =>
      `You wake with a shin that argued all night. The bandage is a story ${s.name} does not remember telling. ${place(s)}, 1835, and the Front Range is not interested in your explanation. Walk anyway. Walk slower.`,
    apply: (s) => ({
      ...s,
      meters: { ...s.meters, health: 55, energy: Math.min(s.meters.energy, 48) },
    }),
  },
  {
    id: "foreign-rack",
    text: (s) =>
      `A drying rack stands at ${place(s)} with someone else’s meat on it, stiff as law. No one claims it. The ravens are considering. ${s.name} did not hang this. 1835. You can take a dead man’s work and still not own the ground.`,
    apply: (s) => ({
      ...s,
      camp: emptyCamp(s.locationId, {
        fireRing: true,
        dryingRack: true,
        smoke: 2,
        jobs: [
          {
            id: "found-dry-meat",
            kind: "dry-meat",
            hoursLeft: 0,
            startedOnDay: Math.max(0, s.dayOfYear - 1),
            payload: 2,
          },
        ],
      }),
    }),
  },
  {
    id: "silas-tin",
    text: (s) =>
      `Silas Crowe is already here at ${place(s)}, sitting on a stone that was not a chair until he made it one. He lifts a tin that is not tea. “${s.name}. Still wasting a good mountain.” 1835. The Front Range keeps worse company.`,
    apply: (s) => ({
      ...s,
      presentCharacterId: "silas-crowe",
    }),
  },
  {
    id: "weather-turns",
    text: (s) =>
      `The sky was one weather when ${s.name} closed both eyes. It is another now at ${place(s)}, and it has opinions. 1835. The Front Range changes its mind without a meeting. You will spend the morning paying for last night’s forecast.`,
    apply: (s, rng) => ({
      ...s,
      weather: s.season === "winter" ? (rng() < 0.5 ? "blizzard" : "snow") : s.season === "summer" ? "storm" : "wind",
    }),
  },
  {
    id: "ned-edge",
    fits: (_loc, _season, hour) => hour >= 16 || hour <= 6,
    text: (s) =>
      `The boy from St. Louis is standing at the edge of ${place(s)} as if the country might send him back. ${s.name} has not invited him. 1835. Dusk, or the rumor of it, makes him look younger than hunger.`,
    apply: (s) => ({
      ...s,
      presentCharacterId: "ned-calhoun",
    }),
  },
  {
    id: "burn-ash",
    fits: (loc) => loc === "burned-timber" || loc === "lightning-pine",
    text: (s) =>
      `You wake in charcoal at ${place(s)}. Last summer’s fire still blackens the tongue. ${s.name}, 1835, and this is a camp only because you stopped walking. Black spars. No roof. The Front Range burned this already and is not sorry.`,
    apply: (s) => ({
      ...s,
      inventory: { ...s.inventory, firewood: s.inventory.firewood + 1 },
    }),
  },
  {
    id: "saddle-wind",
    fits: (loc) => loc === "wind-saddle" || loc === "high-camp",
    text: (s) =>
      `The saddle tries to throw ${s.name} while still lying down. Wind is the whole country at ${place(s)}. 1835. Nothing grows higher than a knee. You came up here on purpose, which will be difficult to explain to a grave.`,
    apply: (s) => ({
      ...s,
      weather: s.weather === "clear" ? "wind" : s.weather,
      meters: { ...s.meters, warmth: Math.min(s.meters.warmth, 42) },
    }),
  },
  {
    id: "cache-hole",
    fits: (loc) => loc === "cache-deadfall" || loc === "lightning-pine",
    text: (s) =>
      `A hole has been dug and filled and dug again at ${place(s)}. ${s.name} slept in the depression like a man who ran out of pride. 1835. Peggy’s blaze, or a liar’s. The Front Range keeps other people’s meat and other people’s trouble.`,
    apply: (s) => ({
      ...s,
      inventory: {
        ...s.inventory,
        extras: s.inventory.extras.includes("deadfall-ticket")
          ? s.inventory.extras
          : [...s.inventory.extras, "deadfall-ticket"],
      },
    }),
  },
  {
    id: "beaver-tea",
    fits: (loc) => loc === "beaver-meadow" || loc === "creek",
    text: (s) =>
      `Tea-water and gnawed sticks. ${s.name} wakes to a slap that is not a man at ${place(s)}. 1835. The dams are still working. The money is not. You can drink. You can trap. You can remember this was supposed to be a living.`,
  },
  {
    id: "cabin-approach",
    fits: (loc) => loc === "timberline" || loc === "abandoned-cabin",
    text: (s) =>
      `Wagon ruts die in the trees below ${place(s)}. ${s.name} can smell a stove that is not theirs — grease, discipline, a woman who keeps a door. 1835. The cabin is a rumor with a chimney. You have not been invited. The Front Range does not care.`,
    apply: (s) => {
      const known = s.knownLocations.includes("abandoned-cabin")
        ? s.knownLocations
        : [...s.knownLocations, "abandoned-cabin"];
      return { ...s, knownLocations: known };
    },
  },
];

export function pickOpening(
  rng: () => number,
  loc: LocationId,
  season: Season,
  hour: number,
  seed: number,
): OpeningDef {
  const fitted = OPENINGS.filter((o) => !o.fits || o.fits(loc, season, hour));
  const pool = fitted.length ? fitted : OPENINGS;
  // Mix seed with loc+season so the same opening+location+season is avoided when the seed can do it.
  let h = seed >>> 0;
  const locBits = loc.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const seasonBits = { spring: 3, summer: 7, fall: 11, winter: 19 }[season];
  h = (Math.imul(h ^ locBits, 16777619) ^ seasonBits) >>> 0;
  const idx = pool.length ? h % pool.length : 0;
  const comboKey = `${pool[idx]!.id}:${loc}:${season}`;
  const alt = pool[(idx + 1) % pool.length]!;
  const first = pool[idx]!;
  // If we landed on a very common triple (first opening + first loc), bump.
  if (comboKey === `${OPENINGS[0]!.id}:high-camp:spring` && pool.length > 1) {
    return alt;
  }
  return first;
}
