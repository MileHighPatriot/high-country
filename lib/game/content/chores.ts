import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type { EncounterDef, GameState, Outcome } from "@/lib/game/types";

export type ChoreKind = "search" | "arrive" | "wait";

/** Recover the chore kind from an active id like `chore-high-camp-spring-search-2`. */
export function choreKindFromId(id: string): ChoreKind {
  if (id.includes("-search")) return "search";
  if (id.includes("-arrive")) return "arrive";
  return "wait";
}

export function waitFlavor(state: GameState): string {
  const byWeather: Record<string, string[]> = {
    clear: [
      "You sit in weather that has no argument. Hours go anyway.",
      "The sky holds. You do not. Time is still a tax.",
    ],
    wind: [
      "The wind works the seams of your coat. You wait it down to a meaner breeze.",
      "You put your back to a rock and let the wind spend itself on someone else’s ridge.",
    ],
    snow: [
      "Snow writes over your tracks while you hunker. When it eases, the country is a new letter.",
      "You wait under a spruce until the flakes thin. Wet wool. A later hour.",
    ],
    blizzard: [
      "You become a dark lump and count breaths. The blizzard does not get bored. It gets slightly less interested.",
      "White erases the next tree. You wait until the world has edges again.",
    ],
    storm: [
      "Thunder walks the divide. You count the gap until the count gets kind.",
      "Rain finds every hole in the kit. You wait it out like a debt.",
    ],
  };
  const lines = byWeather[state.weather] ?? byWeather.clear!;
  const i = (state.rngSeed + state.hour) % lines.length;
  return lines[i]!;
}

export function forageOutcome(state: GameState): Outcome {
  const loc = LOCATION_BY_ID[state.locationId];
  const tags = loc?.tags ?? [];
  const winter = state.season === "winter";
  const fall = state.season === "fall";
  const herb = state.inventory.extras.includes("herb-lore");
  const peggy = state.inventory.extras.includes("peggy-favor");
  const ticket = state.inventory.extras.includes("deadfall-ticket");
  const iceCache =
    state.inventory.extras.includes("ice-cache") || state.inventory.extras.includes("ice-cached-meat");

  if (state.locationId === "cache-deadfall" && ticket) {
    return {
      text: "The blaze is still yours. Under stone and spruce: the meat you banked, frozen honest, plus a twist Peggy must have added.",
      hours: 0,
      inventory: { rations: peggy ? 3 : 2 },
      extraRemove: "deadfall-ticket",
      meters: { energy: -6, warmth: winter ? -8 : -2 },
    };
  }
  if (state.locationId === "talus-ice-cave" && iceCache) {
    return {
      text: "The throat still holds what you hung. You cut a day’s meat and leave the rest to the dark.",
      hours: 0,
      inventory: { rations: 2 },
      extraRemove: state.inventory.extras.includes("ice-cache") ? "ice-cache" : "ice-cached-meat",
      meters: { energy: -8, warmth: -12 },
    };
  }

  const seed = state.rngSeed + state.daysSurvived * 13 + state.hour;
  const roll = (n: number) => ((seed * (n + 3) * 1103515245 + 12345) >>> 0) / 4294967296;

  let rations = 0;
  let firewood = 0;
  let water = 0;
  let pelts = 0;
  const bits: string[] = [];

  if (tags.includes("game")) {
    const p = (winter ? 0.22 : fall ? 0.48 : 0.36) + (herb ? 0.1 : 0);
    if (roll(1) < p) {
      rations += 1;
      bits.push(
        winter
          ? "A snowshoe hare, white on white. Meat the size of a fist."
          : fall
            ? "Grouse in the krummholz. You wring it without a speech."
            : "A rabbit in a snare that is not quite yours. You take it anyway.",
      );
    } else if (roll(2) < 0.12) {
      pelts += 1;
      bits.push("A marten already stiff. Poor fur. Still a pelt.");
    } else {
      bits.push(
        winter
          ? "Tracks, yesterday’s, filled with wind. The animal is in someone else’s fire."
          : "Game sign, nothing attached to it. The country keeps its living.",
      );
    }
  } else if (roll(7) < (winter ? 0.1 : 0.2) + (herb ? 0.08 : 0)) {
    rations += 1;
    bits.push(
      winter
        ? "Rose hips still hanging, frozen sweet. A handful. Not a supper. A stay of execution."
        : fall
          ? "Pine nuts from a squirrel midden. You pay the squirrel in curses."
          : "Spring beauty, dandelion, a few bites that count.",
    );
  }

  if (tags.includes("wood")) {
    const p = winter ? 0.55 : 0.78;
    if (roll(3) < p) {
      firewood += 1;
      if (roll(4) < (winter ? 0.15 : 0.35)) firewood += 1;
      bits.push(
        winter
          ? "Dead limbs under snow. One armful if you count the cursing."
          : "Dry punk and a fallen limb. Enough to argue with evening.",
      );
    } else {
      bits.push("The ground does not owe you timber today. Green wood and a dull hatchet.");
    }
  }

  if (tags.includes("water") && !winter && state.weather !== "blizzard") {
    if (roll(5) < 0.35) {
      water += 1;
      bits.push("A seep you had stepped over. One skin, iron-tasting, honest.");
    }
  }

  if (tags.includes("shelter") && roll(6) < 0.2) {
    bits.push("Someone slept here. They left a nail, not a supper.");
  }

  if (rations + firewood + water + pelts === 0 && bits.length === 0) {
    const empty = [
      "You turn over a stone and find only another stone.",
      "A rusted trap, sprung and useless, like a mouth that already ate.",
      "The ground keeps its secrets. You keep your hours, mostly spent.",
      "Wind, grit, a shiny nothing. You pocket pride and no weight.",
    ];
    bits.push(empty[state.daysSurvived % empty.length]!);
  }

  return {
    text: bits.join(" "),
    hours: 0,
    inventory: {
      rations,
      firewood,
      water,
      pelts,
    },
    meters: { energy: -6, warmth: winter ? -8 : -2 },
  };
}

export function choreEncounter(state: GameState, kind: ChoreKind): EncounterDef {
  const id = `chore-${state.locationId}-${state.season}-${kind}`;
  if (kind === "wait") {
    return {
      id,
      text: waitFlavor(state),
      choices: [
        {
          id: "ok",
          label: "Sit it out",
          outcome: { text: "Time moves. You are still here.", hours: 0 },
        },
      ],
    };
  }
  if (kind === "arrive") {
    const arrivals = [
      "The place is only itself. No one calls your name. That is not always mercy.",
      "You come in on your own tracks, or what the weather left of them.",
      "Nothing here wants you. That is a kind of welcome.",
    ];
    return {
      id,
      text: arrivals[state.daysSurvived % arrivals.length]!,
      choices: [
        {
          id: "ok",
          label: "Take it in",
          outcome: { text: "You set your pack down and listen to your own breath.", hours: 0 },
        },
      ],
    };
  }
  const forage = forageOutcome(state);
  return {
    id: `${id}-${state.daysSurvived % 7}`,
    text: forage.text,
    choices: [
      {
        id: "take",
        label: "Take what the ground allowed",
        outcome: { ...forage, text: "You pocket what little the ground allowed.", hours: 0 },
      },
      {
        id: "leave",
        label: "Leave it",
        outcome: { text: "You keep moving. The ground keeps its secrets.", hours: 0 },
      },
    ],
  };
}
