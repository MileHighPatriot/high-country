import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type { EncounterDef, GameState, LocationId, Outcome } from "@/lib/game/types";
import { timeBand } from "@/lib/game/types";

export type ChoreKind = "search" | "arrive" | "wait";

/** Recover the chore kind from an active id like `chore-high-camp-spring-search-2`. */
export function choreKindFromId(id: string): ChoreKind {
  if (id.includes("-search")) return "search";
  if (id.includes("-arrive")) return "arrive";
  return "wait";
}

export function waitFlavor(state: GameState): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const place = loc?.name ?? "this ground";
  const band = timeBand(state.hour);
  const hourBit =
    band === "night"
      ? "Night holds."
      : band === "dawn"
        ? "The east is a rumor of iron."
        : band === "morning"
          ? "Morning thins."
          : band === "afternoon"
            ? "The afternoon spends itself."
            : "Dusk takes the color out of the timber.";
  const byWeather: Record<string, string[]> = {
    clear: [
      `You sit at ${place} in weather that has no argument. ${hourBit} Hours go anyway.`,
      `The sky over ${place} holds. You do not. Time is still a tax.`,
      `Clear air at ${place}. You watch a ridge do nothing, which is the country’s whole profession.`,
    ],
    wind: [
      `The wind works the seams of your coat at ${place}. You wait it down to a meaner breeze. ${hourBit}`,
      `You put your back to a rock at ${place} and let the wind spend itself on someone else’s ridge.`,
      `${place} is a flute the wind has been practicing for a century. You wait out a verse.`,
    ],
    snow: [
      `Snow writes over your tracks at ${place}. When it eases, the country is a new letter. ${hourBit}`,
      `You wait under a spruce at ${place} until the flakes thin. Wet wool. A later hour.`,
      `Snow at ${place} makes a quiet you could mistake for mercy. It is only snow.`,
    ],
    blizzard: [
      `You become a dark lump at ${place} and count breaths. The blizzard does not get bored. It gets slightly less interested.`,
      `White erases the next tree. ${place} is a rumor. You wait until the world has edges again.`,
      `${hourBit} The blizzard at ${place} works your name down to a noise. You wait anyway.`,
    ],
    storm: [
      `Thunder walks the divide above ${place}. You count the gap until the count gets kind. ${hourBit}`,
      `Rain finds every hole in the kit. You wait it out at ${place} like a debt.`,
      `The storm uses ${place} for a drum. You sit inside the beat and hate music.`,
    ],
  };
  const lines = byWeather[state.weather] ?? byWeather.clear!;
  const i = (state.rngSeed + state.hour + state.dayOfYear) % lines.length;
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

  const place = loc?.name ?? "this ground";
  const band = timeBand(state.hour);
  const hourBit =
    band === "night"
      ? "You do this mostly by touch."
      : band === "dawn"
        ? "First light makes the ground honest."
        : band === "dusk"
          ? "You hurry because dusk does not wait."
          : band === "afternoon"
            ? "The afternoon is long enough to be thorough."
            : "Morning still has patience in it.";

  if (state.locationId === "cache-deadfall" && ticket) {
    return {
      text: `The blaze is still yours at ${place}. Under stone and spruce: the meat you banked, frozen honest, plus a twist Peggy must have added. ${hourBit}`,
      hours: 0,
      inventory: { rations: peggy ? 3 : 2 },
      extraRemove: "deadfall-ticket",
      meters: { energy: -6, warmth: winter ? -8 : -2 },
    };
  }
  if (state.locationId === "talus-ice-cave" && iceCache) {
    return {
      text: `The throat still holds what you hung. You cut a day’s meat and leave the rest to the dark. ${hourBit}`,
      hours: 0,
      inventory: { rations: 2 },
      extraRemove: state.inventory.extras.includes("ice-cache") ? "ice-cache" : "ice-cached-meat",
      meters: { energy: -8, warmth: -12 },
    };
  }
  if (state.inventory.extras.includes("camp-cache") && (state.locationId === "high-camp" || loc?.tags.includes("shelter"))) {
    return {
      text: `You take back what you banked under the rocks at ${place}. The meat has the taste of patience.`,
      hours: 0,
      inventory: { rations: 2 },
      extraRemove: "camp-cache",
      meters: { energy: -4 },
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
          ? `A snowshoe hare at ${place}, white on white. Meat the size of a fist. ${hourBit}`
          : fall
            ? `Grouse in the krummholz at ${place}. You wring it without a speech.`
            : `A rabbit in a snare that is not quite yours, here at ${place}. You take it anyway.`,
      );
    } else if (roll(2) < 0.12) {
      pelts += 1;
      bits.push(`A marten already stiff at ${place}. Poor fur. Still a pelt.`);
    } else {
      bits.push(
        winter
          ? `Tracks at ${place}, yesterday’s, filled with wind. The animal is in someone else’s fire.`
          : `Game sign at ${place}, nothing attached to it. The country keeps its living. ${hourBit}`,
      );
    }
  } else if (roll(7) < (winter ? 0.1 : 0.2) + (herb ? 0.08 : 0)) {
    rations += 1;
    bits.push(
      winter
        ? `Rose hips still hanging at ${place}, frozen sweet. A handful. Not a supper. A stay of execution.`
        : fall
          ? `Pine nuts from a squirrel midden at ${place}. You pay the squirrel in curses.`
          : `Spring beauty, dandelion, a few bites that count, pulled from ${place}.`,
    );
  }

  if (tags.includes("wood")) {
    const p = winter ? 0.55 : 0.78;
    if (roll(3) < p) {
      firewood += 1;
      if (roll(4) < (winter ? 0.15 : 0.35)) firewood += 1;
      bits.push(
        winter
          ? `Dead limbs under snow at ${place}. One armful if you count the cursing.`
          : `Dry punk and a fallen limb at ${place}. Enough to argue with evening.`,
      );
    } else {
      bits.push(`${place} does not owe you timber today. Green wood and a dull hatchet. ${hourBit}`);
    }
  }

  if (tags.includes("water") && !winter && state.weather !== "blizzard") {
    if (roll(5) < 0.35) {
      water += 1;
      bits.push(`A seep at ${place} you had stepped over. One skin, iron-tasting, honest.`);
    }
  }

  if (tags.includes("shelter") && roll(6) < 0.2) {
    bits.push(`Someone slept here at ${place}. They left a nail, not a supper.`);
  }

  if (rations + firewood + water + pelts === 0 && bits.length === 0) {
    const empty = [
      `You turn over a stone at ${place} and find only another stone. ${hourBit}`,
      `A rusted trap at ${place}, sprung and useless, like a mouth that already ate.`,
      `${place} keeps its secrets. You keep your hours, mostly spent. ${hourBit}`,
      `Wind, grit, a shiny nothing at ${place}. You pocket pride and no weight.`,
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

const ARRIVALS: Record<string, string[]> = {
  "high-camp": [
    "The lean-to is still yours. Canvas talks. The Front Range hangs over the bench like a wall you have already agreed not to climb today.",
    "You come home to a scrape of poles and a woodpile the wind has been editing. This is home only because you have nothing else.",
    "High camp takes you in the way a coat takes rain: not gladly, but it is the job.",
    "The bench is wind-scoured and familiar. Your own tracks, or the weather’s idea of them, lead to the door that is not a door.",
    "Lodgepole, a leak, the smell of old smoke. You drop the pack and listen to your knees.",
  ],
  creek: [
    "The creek is a black muscle. In thaw it runs loud. Today it remembers whatever season it is wearing.",
    "You come down to water. Stones slick. The Front Range reflected and then broken by a stick you throw for no reason.",
    "Frozen or not, the creek is a fact. You smell iron and willows and the possibility of not dying of thirst.",
    "Downstream the willows argue. Upstream the ice-fall, if it is that kind of year. You have arrived at the only honest thing on this mountain.",
  ],
  timberline: [
    "The trees give up here. Krummholz like clenched fists. You come in on a game trail that has been used by better animals.",
    "Timberline is a rumor of shelter that does not pay. Wind has opinions. You stand in them.",
    "You arrive where walking in a circle can be called a journey. The Front Range is very close and no kinder.",
    "Dwarf pine, scoured rock, a view that would be pretty if pretty were a ration.",
  ],
  "ute-camp": [
    "Hide lodges, or the rings of stone that remember them. You come in slow, because this park has owners.",
    "The hunting camp is a silence with a shape. Smoke if the band is here. Wind if they are not.",
    "You arrive as a guest whether you know it or not. The park does not correct you. People will.",
  ],
  "abandoned-cabin": [
    "Peeled-log walls. A stove that still draws if you treat it right. Someone claimed this. Someone may still.",
    "The cabin sits in its own weather. You smell old grease and a woman’s discipline, or the ghost of it.",
    "You come into the yard like a man who has been imagining a roof. The door will decide if you were right.",
    "Chimney, axe-scarred block, a window that is mostly rag. Shelter with a personality.",
  ],
  "south-pass": [
    "The pass is a pale suggestion of the trail toward Taos. You can see the idea of the world from here. It does not care.",
    "Overlook air. Thin. The cut below is still a white lie or a mud argument, depending on the month.",
    "You arrive at a place that makes men write letters they should not send. Wind, distance, a mule-shaped hole in the snow.",
  ],
  "beaver-meadow": [
    "Drowned timber and a pond the color of tea. The dams are still working. The money is not.",
    "You come in through willows. Slap-water somewhere. The meadow smells like a fortune ten years gone.",
    "Beaver work, old and new. You arrive as a man who used to think pelts were a future.",
    "Tea-water, gnawed sticks, a lodge like a wet fist. The country is busy without you.",
  ],
  "burned-timber": [
    "Black spars. Fireweed in season. Charcoal that will light if you are desperate enough to taste it.",
    "You walk into last summer’s argument. The burn is quiet now. That is not the same as safe.",
    "Skeletons of pine. The ground crunches. You arrive in a place that already had its disaster.",
  ],
  "avalanche-chute": [
    "A raw stripe down the mountain. In winter it is a loaded gun. In summer it is scree and smashed trees.",
    "You come onto the chute and feel the slope thinking. Stories end here. You tell yourself you are not a story.",
    "White or grey, the chute is a sentence. You have walked into the middle of it.",
  ],
  "hot-spring": [
    "Mineral water breathing steam even in January. The stones are slick. The heat is a kindness that will make you stupid.",
    "You smell sulfur before you see it. The soak is a rumor of towns. There is no town.",
    "Steam, algae, a ring of stones worn by other knees. You have arrived at the only warm water for a day’s walk.",
  ],
  "elk-wallow": [
    "Mud and hair and the sweet rot of a place animals trust. Tracks tell you more than most men will.",
    "You come in on the meat trail. The wallow is busy with ghosts of elk. Some of them may still be attached.",
    "Wallow stink, which is a kind of map. You have arrived where the country feeds itself.",
  ],
  "wind-saddle": [
    "Nothing grows higher than your knee. The wind has opinions. Crossing this in a blizzard is how stories end.",
    "You come onto the saddle and become a flag. The next ridge is a rumor you can almost walk to.",
    "Scoured stone, a cairn, weather arriving from three directions. You have not found shelter. You have found a view.",
  ],
  "frozen-fall": [
    "A waterfall that spends half the year as a pillar. You can hear it work even when you cannot see the water.",
    "Ice the size of oxen, or a white rope of melt. You arrive at a noise that has been here longer than names.",
    "The fall calved last week or last century. You stand at the plunge-pool and feel small in a useful way.",
  ],
  "lightning-pine": [
    "A ponderosa split to the root and still standing. Travelers blaze it. Some leave things. Some take them.",
    "You come up the goat trail to the snag. Pitch smell. A mark you did not cut.",
    "The split pine is a post office for people who do not write. You have arrived at other people’s business.",
  ],
  "mexican-trail-camp": [
    "Cart ruts, a stone ring, the ghost of chile and mule. People in summer. Wind in winter.",
    "You come onto the old Taos trace. The camp is a seasonal idea. Today it is either a fire or a regret.",
    "Mule-smell or the memory of it. You have arrived where men still believe the pass is a road.",
  ],
  "arapaho-ground": [
    "Open park and distant lodges when the season is right. You are a guest here whether you know it or not.",
    "You arrive on someone else’s hunting ground. The grass does not tell you the rules. People will.",
    "Distance, antelope weather, a silence with owners. You keep your hands visible.",
  ],
  "cache-deadfall": [
    "A sprung deadfall and a hole that has been dug more than once. Someone believed this ground would keep a secret.",
    "You come to the blaze. Stones, spruce, the smell of old meat or the hope of it.",
    "The cache is a conversation between thieves. You have arrived to add a sentence or steal one.",
  ],
  "talus-ice-cave": [
    "A throat of rock that holds last year’s ice. Cold as a root cellar. You can cache meat here. You can also not come out.",
    "You pick through talus into the dark. Breath comes back as frost. The cave is a landlord.",
    "Ice in August, ice in January. You have arrived at a cold that does not negotiate.",
  ],
  "homesteader-ruin": [
    "A foundation and a chimney that outlived the people. A child’s shoe in the weeds if you look too long.",
    "You come along the fenceline gone to rot. The ruin is still deciding whether it is a house.",
    "Brick, nettles, a well-rope. Someone tried to stay. The mountain filed the paperwork.",
  ],
  "grizzly-basin": [
    "A hanging basin of willow and old snow. The bears come through in berry months. In winter it is a white bowl that swallows sound.",
    "You drop into the basin and the world gets quieter, which is not comfort.",
    "Willow, slide-alder, a dark that keeps afternoon. You have arrived in a place with a name it earned.",
  ],
  "south-park-rim": [
    "The park opens like a rumor of easier country. Antelope weather. You can see weather coming for half a day.",
    "You come onto the rim and the world gets wider than your plans. That is a problem and a gift.",
    "Wind, grass, a ledger of animals too far for a clean shot. You have arrived at hope with a range problem.",
  ],
};

export function arrivalParagraph(state: GameState, to: LocationId, trailName?: string): string {
  const dest = LOCATION_BY_ID[to];
  const band = timeBand(state.hour);
  const lines = ARRIVALS[to] ?? [
    dest?.blurb ?? "The place is only itself.",
    "You come in on your own tracks, or what the weather left of them.",
    "Nothing here wants you. That is a kind of welcome.",
  ];
  const i = (state.rngSeed + state.dayOfYear + state.hour) % lines.length;
  const body = lines[i]!;
  const trail = trailName ? `You take ${trailName}. ` : "";
  const hourMood =
    band === "night"
      ? " Night makes every arrival a guess."
      : band === "dawn"
        ? " Dawn is a thin tin color on the next ridge."
        : band === "dusk"
          ? " Dusk is already spending the light."
          : band === "afternoon"
            ? state.weather === "clear"
              ? " The afternoon is long and does not care."
              : " The afternoon weather has opinions."
            : "";
  const wx =
    state.weather === "blizzard"
      ? " The white has followed you in."
      : state.weather === "storm"
        ? " Thunder is still walking the divide."
        : state.weather === "snow"
          ? " Snow is rewriting the last mile."
          : state.weather === "wind"
            ? " The wind does not clock out."
            : "";
  return `${trail}${body}${hourMood}${wx}`;
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
    return {
      id,
      text: arrivalParagraph(state, state.locationId),
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
