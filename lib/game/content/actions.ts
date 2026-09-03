import { accessibleCount, campMenuChoices } from "@/lib/game/camp";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type { Choice, GameState, LocationId, TimeBand, Weather } from "@/lib/game/types";
import { timeBand } from "@/lib/game/types";

export { campHotspots } from "@/lib/game/camp";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function locHash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function campRng(state: GameState, salt = 0) {
  return mulberry32(
    (state.rngSeed + state.dayOfYear * 1009 + state.hour * 17 + locHash(state.locationId) + salt) >>> 0,
  );
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

type FlavorLine = {
  text: string;
  bands?: TimeBand[];
  weather?: Weather[];
  tags?: Array<"water" | "wood" | "shelter" | "game" | "trade">;
  locations?: LocationId[];
  fire?: boolean;
  open?: boolean;
};

function flavorMatches(state: GameState, line: FlavorLine): boolean {
  const band = timeBand(state.hour);
  const loc = LOCATION_BY_ID[state.locationId];
  if (line.bands && !line.bands.includes(band)) return false;
  if (line.weather && !line.weather.includes(state.weather)) return false;
  if (line.locations && !line.locations.includes(state.locationId)) return false;
  if (line.tags && !line.tags.some((t) => loc?.tags.includes(t))) return false;
  if (line.fire != null && line.fire !== state.campfire) return false;
  if (line.open) {
    const shelter = loc?.tags.includes("shelter") || state.locationId === "high-camp";
    if (shelter) return false;
  }
  return true;
}

export function pickFlavor(state: GameState, pool: FlavorLine[], salt = 0): string {
  const hit = pool.filter((l) => flavorMatches(state, l));
  const use = hit.length ? hit : pool;
  const rng = campRng(state, salt + 91);
  return pick(
    rng,
    use.map((l) => l.text),
  );
}

const EAT_LINES: FlavorLine[] = [
  { text: "You eat sitting on your heels. Grease on the thumb. The hour agrees to continue." },
  { text: "A strip of meat, chewed until it forgets it was an animal. Hunger steps back one pace." },
  { text: "You eat with your back to the wind. Flour, fat, the idea of salt." },
  { text: "Cold ration. You make a ceremony of it anyway, because otherwise it is only postponement." },
  {
    text: "Dawn ration. The sky is a thin tin color. You chew and watch the east invent itself.",
    bands: ["dawn"],
  },
  {
    text: "Morning food tastes like work you have not done yet. You eat it anyway.",
    bands: ["morning"],
  },
  {
    text: "Noon, and the meat is warm from the bag. Flies vote. You eat standing.",
    bands: ["afternoon"],
  },
  {
    text: "Dusk meal. You eat slower than hunger wants. The country is changing its mind about light.",
    bands: ["dusk"],
  },
  {
    text: "Night food is counted. You eat in the dark so you will not see how little it is.",
    bands: ["night"],
  },
  {
    text: "You eat by the fire. Fat pops. Something in the timber takes an interest in the smell.",
    fire: true,
    bands: ["dusk", "night"],
  },
  {
    text: "Shelter and a bite. The roof makes the chewing sound smaller, which is a kind of wealth.",
    tags: ["shelter"],
  },
  {
    text: "Snow on the meat. You brush it off with a thumb that has forgotten feeling.",
    weather: ["snow", "blizzard"],
  },
  {
    text: "Wind steals crumbs as if it paid for them. You hunch and finish.",
    weather: ["wind"],
  },
  {
    text: "Rain in the flour. You eat paste and call it a meal because the alternative is a speech.",
    weather: ["storm"],
  },
  {
    text: "At the lean-to you eat like a man who still believes this bench is a home.",
    locations: ["high-camp"],
  },
  {
    text: "Creek-side, you eat with wet stones for a table. The water talks with its mouth full.",
    locations: ["creek"],
  },
];

const DRINK_LINES: FlavorLine[] = [
  { text: "You drink. For a minute the world is a simple tool." },
  { text: "The canteen lightens. Your tongue remembers it is not leather." },
  { text: "A swallow, then another. Thirst files a later complaint." },
  { text: "Iron water. Granite water. You take it like pay." },
  { text: "You drink with your eyes on the country. Men who stare at the tin get surprised." },
  {
    text: "Dawn water is colder than the hour. It wakes the teeth first.",
    bands: ["dawn"],
  },
  {
    text: "Noon thirst is a clerk. You pay it and keep the receipt in your mouth.",
    bands: ["afternoon"],
  },
  {
    text: "Night water. You drink in the dark and listen for the second swallow, the one that means you still have some.",
    bands: ["night"],
  },
  {
    text: "Snowmelt on the lip of the tin. It tastes of last year.",
    weather: ["snow"],
  },
  {
    text: "You drink under the blizzard’s noise. The water is the only warm argument you have left, and it is not warm.",
    weather: ["blizzard"],
  },
  {
    text: "Creek water, even from the canteen, remembers the rocks it came from.",
    tags: ["water"],
  },
  {
    text: "Hot-spring steam on the mouth of the bottle. Mineral. A little like blood.",
    locations: ["hot-spring"],
  },
];

const FIRE_LINES: FlavorLine[] = [
  { text: "The fire takes. You remember you have a face." },
  { text: "Smoke finds the lean of the ground. Heat finds the bones that filed a complaint." },
  { text: "Punk, breath, a coal. You feed it like a nervous animal." },
  { text: "Flame. Small. Honest. The hour steps closer to being survivable." },
  {
    text: "Dawn fire. The smoke goes sideways and the light does not know which of you to believe.",
    bands: ["dawn"],
  },
  {
    text: "You build it against afternoon wind. The flame leans like a man listening.",
    bands: ["afternoon"],
    weather: ["wind", "clear"],
  },
  {
    text: "Dusk fire. You make a room out of light that will not last the night.",
    bands: ["dusk"],
  },
  {
    text: "Night fire. Every spark is a letter sent up the mountain. You hope nothing literate is reading.",
    bands: ["night"],
  },
  {
    text: "Snow hisses on the first sticks. You curse and feed it anyway.",
    weather: ["snow"],
  },
  {
    text: "Pitch light, mean and holy. The blizzard does not care. You do.",
    weather: ["blizzard"],
  },
  {
    text: "In the cabin stove the fire sounds like a settled argument.",
    locations: ["abandoned-cabin", "homesteader-ruin"],
  },
  {
    text: "On this open bench the fire is a claim. You sit inside it as if rent were paid.",
    locations: ["high-camp", "wind-saddle", "south-pass"],
  },
];

const SLEEP_LINES: FlavorLine[] = [
  {
    text: "You sleep by the fire. Coals tick. Dawn is not kinder, only later, and you still have a face.",
    fire: true,
  },
  {
    text: "Fire at your boots, dark at your back. You sleep in shifts your body invents.",
    fire: true,
    bands: ["night", "dusk"],
  },
  {
    text: "The lean-to roof talks all night. You sleep under it anyway. This is what passes for a house.",
    locations: ["high-camp"],
  },
  {
    text: "Cabin walls. A stove that believes in morning. You sleep like a person who has been allowed to.",
    locations: ["abandoned-cabin"],
  },
  {
    text: "You lie in the ruin’s chimney-shadow. Brick holds a little of yesterday’s heat. You steal it.",
    locations: ["homesteader-ruin"],
  },
  {
    text: "Ice cave sleep. Your breath comes back at you as frost. You wake counting fingers.",
    locations: ["talus-ice-cave"],
  },
  {
    text: "You sleep in the open. The stars are very clear. That is not a comfort.",
    open: true,
  },
  {
    text: "No roof. You curl around the idea of warmth and call it a night.",
    open: true,
    weather: ["clear", "wind"],
  },
  {
    text: "Snow stitches your blanket to the ground. You sleep in a white pocket and hate the dark.",
    weather: ["snow"],
    open: true,
  },
  {
    text: "Blizzard. You sleep because standing has become a theory. The wind works your name down to a noise.",
    weather: ["blizzard"],
  },
  {
    text: "You sleep with the fire between you and the storm. It is a thin treaty. It holds until it doesn’t.",
    weather: ["blizzard", "storm"],
    fire: true,
  },
  {
    text: "In true shelter you let the shoulders drop. The mountain can have the next eight hours of argument.",
    tags: ["shelter"],
  },
  {
    text: "Dawn nap that becomes a theft of morning. You wake later than pride wanted.",
    bands: ["dawn", "morning"],
  },
  {
    text: "You lie down in daylight because the body has filed for bankruptcy. Shame can wait.",
    bands: ["afternoon"],
  },
];

const TEND_LINES: FlavorLine[] = [
  { text: "You feed the coals a stick and sit in the circle they make. Warmth is a small country." },
  { text: "The fire had been thinking of dying. You talk it out of it with punk and patience." },
  { text: "You sit by the fire until your hands remember they are not wood." },
  { text: "Sparks go up. You watch them as if they were a map of a warmer year." },
  {
    text: "Night coals. You bank them the way a miser banks coin, which is to say: badly, and with feeling.",
    bands: ["night"],
  },
  {
    text: "Dusk, and the fire is the only work that still makes sense. You tend it.",
    bands: ["dusk"],
  },
  {
    text: "Wind worries the flame. You build a wall of your own knees and keep it.",
    weather: ["wind"],
  },
  {
    text: "Snow tries the fire and fails, hissing. You add a split and do not smile.",
    weather: ["snow"],
  },
];

const WATCH_LINES: FlavorLine[] = [
  { text: "You sit and watch the country. It does not perform. Hours go anyway." },
  { text: "You rest your legs. The mountain uses the time to remain itself." },
  { text: "Clear air. You glass the next ridge with naked eyes and invent nothing." },
  {
    text: "Noon shade is a rumor. You sit in what there is and let the sweat dry into salt.",
    bands: ["afternoon"],
  },
  {
    text: "Morning light picks out every snag. You count them as if they were livestock.",
    bands: ["morning"],
  },
  {
    text: "From the lean-to bench the Front Range hangs like a wall you have already agreed not to climb today.",
    locations: ["high-camp"],
  },
  {
    text: "The park is a rumor of easier country. You watch weather come for half an hour and call it rest.",
    locations: ["south-park-rim", "south-pass"],
  },
];

export function eatCopy(state: GameState): string {
  return pickFlavor(state, EAT_LINES, 1);
}
export function drinkCopy(state: GameState): string {
  return pickFlavor(state, DRINK_LINES, 2);
}
export function fireCopy(state: GameState): string {
  return pickFlavor(state, FIRE_LINES, 3);
}
export function sleepCopy(state: GameState): string {
  return pickFlavor(state, SLEEP_LINES, 4);
}
export function tendCopy(state: GameState): string {
  return pickFlavor(state, TEND_LINES, 5);
}
export function restWatchCopy(state: GameState): string {
  return pickFlavor(state, WATCH_LINES, 6);
}

export function huntCopy(state: GameState, success: boolean, usedRifle: boolean): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const name = loc?.name ?? "this ground";
  if (success) {
    const hits = [
      usedRifle
        ? `The shot takes. Echo walks ${name} and comes back thinner. You have meat if you do the ugly work.`
        : `You still-hunt until the animal believes you are a stump. Knife work. Meat. Hands red to the wrist.`,
      `At ${name} the country pays in blood. You take what you can carry and leave the rest to ravens.`,
      usedRifle
        ? `Ball and smoke. The animal folds. Powder gone, hunger postponed.`
        : `No shot. Patience, then a hare that trusted the wrong bush. Fist of meat.`,
    ];
    return pick(campRng(state, 11), hits);
  }
  const misses = [
    usedRifle
      ? `The shot goes wide and ${name} swallows the sound. Whatever was there is in the next county.`
      : `Wind, a snapped twig, an empty wallow. You hunt air and come home with a story you will not tell.`,
    `Sign, then nothing. The animal is in someone else’s fire.`,
    usedRifle
      ? `The rifle bucks. A branch takes the ball. You have announced yourself to everything with ears.`
      : `You glass until your eyes water. The country keeps its living.`,
  ];
  return pick(campRng(state, 12), misses);
}

export function fishCopy(state: GameState, success: boolean, ice: boolean): string {
  if (ice) {
    return success
      ? pick(campRng(state, 13), [
          "The ice hole goes black, then silver. You take a fish that has never seen a summer.",
          "Hands in the hole until they are stupid. One trout, paid in skin.",
        ])
      : pick(campRng(state, 14), [
          "The hole skins over while you blow on your fingers. The fish keep their counsel.",
          "Ice, blood from a knuckle, no fish. January collects a tithe.",
        ]);
  }
  return success
    ? pick(campRng(state, 15), [
        "You work the bank. A fish comes like a wet coin. You brain it on a stone without a speech.",
        "Line, patience, a dark back in the tea-water. Meat that still tastes of the creek.",
      ])
    : pick(campRng(state, 16), [
        "The water is a window onto nothing you can eat. You lose an hour to hope.",
        "A strike, a slip, a curse. The creek keeps the fish.",
      ]);
}

export function scoutCopy(state: GameState, success: boolean): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const night = timeBand(state.hour) === "night";
  if (night) {
    return success
      ? "You watch the dark until it has edges. A shape that is not wind. You will remember where."
      : "The dark is a mouth. You stare until your eyes invent company and then invent its leaving.";
  }
  if (success) {
    return pick(campRng(state, 17), [
      `You read sign on ${loc?.name ?? "this ground"}. The country has been writing. You catch up.`,
      "A blaze you had missed. A saddle of tracks. The next place is no longer a rumor.",
      "Savvy work. You see how a man or an elk would go, and you file it.",
    ]);
  }
  return pick(campRng(state, 18), [
    "You scout in a circle and arrive at your own bootprints, which is a kind of honesty.",
    "Wind has unwritten the ground. You learn only that you are still here.",
  ]);
}

export function mendCopy(state: GameState, dryBoots: boolean): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const bits = [
    dryBoots
      ? "You dry the boots until they are only damp, which on this range is a miracle. Tomorrow’s cold will find less to hold."
      : "Thread, grease, a patch. The kit looks less like a confession.",
    `At ${loc?.name ?? "camp"} you rub the rifle down and oil the pan. The metal stops sounding offended.`,
    "You take the wet out of the wool as far as fire and patience will go. Small work. It keeps you from larger mistakes.",
  ];
  return pick(campRng(state, 19), bits);
}

export function snaresCopy(state: GameState, kind: "meat" | "empty" | "cut"): string {
  if (kind === "meat") {
    return pick(campRng(state, 20), [
      "The snare has done the ugly arithmetic. A hare, stiff, honest. You reset the wire.",
      "Fur in the loop. You take it without a speech and leave the set hungrier than you found it.",
    ]);
  }
  if (kind === "cut") {
    return "The wire is cut, not broken. Someone walked your line. The hair on your neck files a report.";
  }
  return pick(campRng(state, 21), [
    "Empty snares. A feather. The suggestion of a joke.",
    "The sets are honest and unemployed. You bait them again with hope, which is poor bait.",
  ]);
}

export function cacheCopy(state: GameState, where: "deadfall" | "ice" | "camp"): string {
  if (where === "deadfall") {
    return "You bury meat under stone and spruce and blaze it the way Peggy would. The ground agrees to try.";
  }
  if (where === "ice") {
    return "You hang meat in the throat of the cave. Cold takes the contract. You do not look back long.";
  }
  return "You cache what you can spare under the bench, rocks on the lid, a mark only you will admit to.";
}

export function shelterCopy(state: GameState): string {
  if (state.weather === "blizzard") {
    return pick(campRng(state, 22), [
      "You dig a snow hole and crawl in like a badger with debts. The wind goes over. You go less.",
      "A trench, a roof of blocks, a dark the blizzard does not own. You lie in it and count the hours it buys.",
    ]);
  }
  return pick(campRng(state, 23), [
    "You throw up a windbreak of spruce and stone. It is not a house. It is an argument.",
    "Night work: a scrape, boughs, your back to the weather. Shelter enough to insult the wind.",
  ]);
}

export function prayCopy(state: GameState, someone: string | null): string {
  const night = timeBand(state.hour) === "night" || timeBand(state.hour) === "dusk";
  if (someone) {
    return pick(campRng(state, 24), [
      `You speak a scrap of scripture or a scrap of song. ${someone} hears it and does not mock, which is a kindness.`,
      `You talk to yourself loud enough to be prayer. ${someone} looks at the fire instead of at you.`,
    ]);
  }
  return pick(campRng(state, 25), [
    night
      ? "You sing under your breath because the dark is too complete. The tune is older than your name."
      : "You sit and say the names of the living you can still remember. It changes nothing you can measure.",
    "A prayer that is mostly inventory: fire, water, the next hour. Amen is a word for men with churches.",
    "You talk to the mountain. It does not answer. That is the correct theology.",
  ]);
}

function sleepLabel(state: GameState, rng: () => number): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const shelter = loc?.tags.includes("shelter") || state.locationId === "high-camp";
  const band = timeBand(state.hour);
  if (state.locationId === "high-camp") {
    return pick(rng, ["Sleep in the lean-to", "Crawl under the canvas", "Lie down in the bench-camp"]);
  }
  if (state.locationId === "abandoned-cabin") {
    return pick(rng, ["Sleep by the stove", "Take the cabin floor", "Lie down behind Eliza’s door"]);
  }
  if (state.locationId === "homesteader-ruin") {
    return pick(rng, ["Sleep in the chimney-shadow", "Lie down in the ruin"]);
  }
  if (state.locationId === "talus-ice-cave") return "Sleep in the ice throat";
  if (state.locationId === "ute-camp") return pick(rng, ["Sleep in the lodge-ring", "Lie down in the park camp"]);
  if (band === "dawn" || (band === "night" && state.meters.energy < 40)) {
    return pick(rng, ["Wait for first light", "Sleep until the east pales", "Lie down and let dawn find you"]);
  }
  if (shelter) return pick(rng, ["Sleep under what roof there is", "Lie down in shelter"]);
  if (state.campfire) return pick(rng, ["Sleep by the fire", "Lie down in the firelight"]);
  if (state.weather === "blizzard") return pick(rng, ["Sleep in this white", "Curl down and endure"]);
  return pick(rng, ["Lie down in the open", "Sleep on this ground", "Spread the blanket and hope"]);
}

function searchLabel(state: GameState, rng: () => number): string {
  const band = timeBand(state.hour);
  const id = state.locationId;
  if (band === "night") {
    return pick(rng, ["Listen in the dark", "Feel for the trail", "Watch the dark"]);
  }
  if (state.weather === "blizzard") {
    return pick(rng, ["Feel a few yards out", "Search what you can see, which is nothing"]);
  }
  if (id === "cache-deadfall") return pick(rng, ["Work the deadfall", "Dig the cache hole", "Read the blaze again"]);
  if (id === "creek" || id === "frozen-fall") {
    return pick(rng, ["Walk the creek ice", "Work the bank", "Search the wrack"]);
  }
  if (id === "abandoned-cabin") {
    return pick(rng, ["Pick through Eliza’s scrap heap", "Search the cabin yard", "Look under the bunk"]);
  }
  if (id === "homesteader-ruin") return pick(rng, ["Poke the chimney weeds", "Search the foundation"]);
  if (id === "timberline") return pick(rng, ["Glass the krummholz", "Work the tree-line", "Search the dwarf timber"]);
  if (id === "lightning-pine") return pick(rng, ["Check the split snag", "Look in the blaze-cache"]);
  if (id === "beaver-meadow") return pick(rng, ["Work the dams", "Search the drowned timber"]);
  if (id === "elk-wallow") return pick(rng, ["Read the wallow", "Search the hair and mud"]);
  if (id === "burned-timber") return pick(rng, ["Pick charcoal and bone", "Search the burn"]);
  if (id === "hot-spring") return pick(rng, ["Search the slick stones", "Look in the soak-ring"]);
  if (id === "grizzly-basin") return pick(rng, ["Glass the basin", "Work the willow edge"]);
  if (id === "high-camp") return pick(rng, ["Search the bench", "Look through your own leavings", "Work the woodpile"]);
  if (id === "mexican-trail-camp") return pick(rng, ["Search the stone ring", "Poke the cart ruts"]);
  return pick(rng, ["Work this ground", "Look closer", "Turn over what the weather left"]);
}

function waterLabel(state: GameState, rng: () => number): string {
  const ice = state.season === "winter" || state.weather === "snow" || state.weather === "blizzard";
  if (ice) return pick(rng, ["Break ice for water", "Chop a drinking hole", "Take water from the ice"]);
  if (state.locationId === "hot-spring") return pick(rng, ["Fill at the seep", "Kneel at the mineral pool"]);
  if (state.locationId === "creek" || state.locationId === "frozen-fall") {
    return pick(rng, ["Fill the canteens", "Kneel at the creek", "Take from the black water"]);
  }
  if (state.locationId === "beaver-meadow") return pick(rng, ["Fill from the pond", "Kneel at the beaver water"]);
  return pick(rng, ["Fill the canteens", "Kneel at the seep", "Take water"]);
}

function woodLabel(state: GameState, rng: () => number): string {
  const hard = timeBand(state.hour) === "night" || state.weather === "blizzard" || state.season === "winter";
  if (hard) {
    return pick(rng, ["Break frozen limbs", "Feel for deadwood", "Gather what wood the dark allows"]);
  }
  if (state.locationId === "burned-timber") return pick(rng, ["Take charcoal wood", "Break the black spars"]);
  if (state.locationId === "lightning-pine") return pick(rng, ["Split pitch from the snag", "Gather under the split pine"]);
  if (state.locationId === "high-camp") return pick(rng, ["Work the woodpile", "Break dead lodgepole"]);
  return pick(rng, ["Gather deadwood", "Break dry limbs", "Make an armful"]);
}

function huntLabel(state: GameState, rng: () => number): string {
  const band = timeBand(state.hour);
  const id = state.locationId;
  if (id === "elk-wallow") return pick(rng, ["Still-hunt the wallow", "Stalk the mud"]);
  if (id === "grizzly-basin") return pick(rng, ["Hunt the basin", "Glass for berry-sign"]);
  if (id === "south-park-rim") return pick(rng, ["Stalk the park edge", "Hunt antelope weather"]);
  if (id === "beaver-meadow") return pick(rng, ["Hunt the willow edge", "Still-hunt the pond"]);
  if (id === "arapaho-ground") return pick(rng, ["Hunt the open park", "Still-hunt the edge"]);
  if (band === "dawn") return pick(rng, ["Still-hunt the dawn", "Hunt first light"]);
  if (band === "dusk") return pick(rng, ["Hunt the last light", "Still-hunt dusk"]);
  return pick(rng, ["Hunt this ground", "Still-hunt", "Walk up game"]);
}

function fishLabel(state: GameState, rng: () => number): string {
  const ice = state.season === "winter" || state.weather === "snow";
  if (ice) return pick(rng, ["Cut an ice hole", "Fish the ice", "Work a hole in the plate"]);
  if (state.locationId === "hot-spring") return pick(rng, ["Fish the warm outflow", "Work the soak-creek"]);
  if (state.locationId === "beaver-meadow") return pick(rng, ["Fish the tea-water", "Work the dam spill"]);
  if (state.locationId === "frozen-fall") return pick(rng, ["Fish below the fall", "Work the plunge-pool"]);
  return pick(rng, ["Work the bank", "Fish the creek", "Try the black water"]);
}

function scoutLabel(state: GameState, rng: () => number): string {
  if (timeBand(state.hour) === "night") {
    return pick(rng, ["Watch the dark", "Read the night", "Listen out"]);
  }
  if (timeBand(state.hour) === "dawn") {
    return pick(rng, ["Read sign at first light", "Scout the dawn tracks", "Glass the morning"]);
  }
  if (state.locationId === "wind-saddle" || state.locationId === "south-pass") {
    return pick(rng, ["Glass the pass", "Read the saddle", "Scout the next weather"]);
  }
  return pick(rng, ["Read sign", "Scout the next ridge", "Walk a circle and look"]);
}

function travelLabel(state: GameState, to: LocationId, trailName: string, rng: () => number): string {
  const dest = LOCATION_BY_ID[to];
  const known = state.knownLocations.includes(to);
  const band = timeBand(state.hour);
  const hard = state.weather === "blizzard" || state.weather === "storm" || band === "night";
  if (hard) {
    if (to === "creek") return pick(rng, ["Feel down to the creek", "The water trail in this weather"]);
    if (to === "wind-saddle") return pick(rng, ["The saddle in this wind", "Cross the saddle blind"]);
    if (to === "high-camp") return pick(rng, ["Feel home to the lean-to", "Back to the bench in this weather"]);
    if (to === "timberline") return pick(rng, ["Feel down to timber", "The switchback in the dark"]);
    if (to === "abandoned-cabin") return pick(rng, ["Feel for the cabin", "The stove, if you can find it"]);
    if (known) return pick(rng, [`Toward ${dest?.name ?? to}, careful`, `Feel for ${dest?.name ?? to}`]);
    return pick(rng, [`Take ${trailName} anyway`, `The unknown trail in this weather`]);
  }
  if (state.camp && to === state.camp.locationId) {
    return pick(rng, ["Back to your camp", "The trail home to your fire", "Back to the ring of stone"]);
  }
  if (to === "high-camp") return pick(rng, ["Back to the lean-to", "Home to high camp", trailName]);
  if (known) {
    return pick(rng, [`Toward ${dest?.name ?? to}`, `The trail to ${dest?.name ?? to}`, trailName]);
  }
  return `Take ${trailName}`;
}

function isHomeward(from: LocationId, to: LocationId, known: LocationId[], campAt?: LocationId | null): boolean {
  if (campAt && to === campAt) return true;
  if (to === "high-camp") return true;
  if (from === "high-camp") return false;
  if (!known.includes(to)) return false;
  return Boolean(LOCATION_BY_ID[to]?.tags.includes("shelter"));
}

function pickTravelEdges(state: GameState, rng: () => number) {
  const loc = LOCATION_BY_ID[state.locationId];
  const edges = [...(loc?.connections ?? [])];
  if (edges.length === 0) return [];
  const band = timeBand(state.hour);
  const hard = state.weather === "blizzard" || state.weather === "storm" || band === "night";
  const weak = state.meters.energy < 35 || state.meters.health < 30;
  let n = hard ? (rng() < 0.45 ? 2 : 1) : rng() < 0.45 ? 3 : 2;
  if (weak) n = Math.min(n, hard ? 1 : 2);
  n = Math.min(n, edges.length);

  const picked: typeof edges = [];
  const add = (e: (typeof edges)[number]) => {
    if (!picked.some((p) => p.to === e.to)) picked.push(e);
  };
  const homeward = edges.filter((e) =>
    isHomeward(state.locationId, e.to, state.knownLocations, state.camp?.locationId),
  );
  if (homeward.length) add(pick(rng, homeward));

  const pool = (
    hard ? edges.filter((e) => state.knownLocations.includes(e.to)) : edges
  ).filter((e) => !picked.some((p) => p.to === e.to));
  const use = pool.length ? pool : edges.filter((e) => !picked.some((p) => p.to === e.to));
  while (picked.length < n && use.length) {
    const i = Math.floor(rng() * use.length);
    add(use.splice(i, 1)[0]!);
  }
  return picked;
}

const FISH_PLACES = new Set(["creek", "frozen-fall", "beaver-meadow", "hot-spring"]);

/**
 * Idle verbs for a bench. Wait is always the hero stance; routine chores are tagged
 * for the Tend camp overflow. Seeded so the same ground at a different hour still shifts.
 */
export function campChoices(state: GameState): Choice[] {
  const rng = campRng(state);
  const loc = LOCATION_BY_ID[state.locationId];
  const tags = loc?.tags ?? [];
  const band = timeBand(state.hour);
  const night = band === "night";
  const dawn = band === "dawn";
  const morning = band === "morning";
  const afternoon = band === "afternoon";
  const dusk = band === "dusk";
  const blizzard = state.weather === "blizzard";
  const shelter = hasShelter(state) || tags.includes("shelter");
  const exhausted = state.meters.energy < 35;
  const starving = state.meters.hunger < 30;
  const parched = state.meters.thirst < 30;
  const fatwood = state.inventory.extras.includes("fatwood");

  const must: Choice[] = [];
  const good: Choice[] = [];
  const flavor: Choice[] = [];

  if (state.presentCharacterId) {
    const p = CHARACTER_BY_ID[state.presentCharacterId];
    must.push({
      id: "talk",
      label: p ? `Talk to ${p.name}` : "Talk",
      action: { type: "talk" },
      tier: "hero",
    });
  }

  must.push({
    id: "wait",
    label: "Let time pass",
    hint: blizzard ? "Four hours in this white" : night ? "Three hours of dark" : "Four hours",
    action: { type: "wait" },
    tier: "hero",
  });
  flavor.push({
    id: "watch",
    label: "Watch a while",
    hint: "One or two hours",
    action: { type: "restWatch" },
    tier: "routine",
  });

  const rationsOnHand = accessibleCount(state, "rations");
  const waterOnHand = accessibleCount(state, "water");
  const showEat = state.meters.hunger < 70 || (rationsOnHand > 0 && state.meters.hunger < 85);
  if (starving && rationsOnHand <= 0) {
    must.push({
      id: "eat",
      label: "The bag is empty",
      disabled: true,
      hint: "No rations",
      action: { type: "eat" },
    });
  } else if (showEat && rationsOnHand > 0) {
    const eat: Choice = {
      id: "eat",
      label: pick(rng, ["Eat", "Chew a ration", "Take a bite"]),
      hint: `${rationsOnHand} left`,
      action: { type: "eat" },
    };
    if (starving) must.unshift(eat);
    else good.push(eat);
  }

  const showDrink = state.meters.thirst < 70 || (waterOnHand > 0 && state.meters.thirst < 85);
  if (parched && waterOnHand <= 0) {
    must.push({
      id: "drink",
      label: "The canteen is a drum",
      disabled: true,
      hint: "Canteen empty",
      action: { type: "drink" },
    });
  } else if (showDrink && waterOnHand > 0) {
    const drink: Choice = {
      id: "drink",
      label: pick(rng, ["Drink", "A swallow", "Wet your mouth"]),
      hint: `${waterOnHand} left`,
      action: { type: "drink" },
    };
    if (parched) must.push(drink);
    else good.push(drink);
  }

  const sleepOk = night || dusk || exhausted || (blizzard && state.meters.energy < 55);
  if (sleepOk) {
    const sleep: Choice = { id: "sleep", label: sleepLabel(state, rng), action: { type: "sleep" } };
    if (night || exhausted || blizzard) must.push(sleep);
    else good.push(sleep);
  }

  if (state.campfire) {
    const tend: Choice = {
      id: "tend",
      label: pick(rng, ["Feed the fire", "Sit by the fire", "Bank the coals"]),
      action: { type: "tendFire" },
    };
    if (blizzard || night || dusk) must.push(tend);
    else if (rng() < 0.7) good.push(tend);
  } else {
    const noWood = state.inventory.firewood <= 0;
    const blocked = blizzard && !fatwood;
    if (!blocked || fatwood) {
      const fire: Choice = {
        id: "fire",
        label: pick(rng, ["Make a fire", "Build a fire", "Get a coal going"]),
        disabled: noWood || blocked,
        hint: blocked
          ? "Needs fatwood in this white"
          : fatwood && blizzard
            ? "Fatwood against the blizzard"
            : noWood
              ? "No wood"
              : undefined,
        action: { type: "makeFire" },
      };
      if (blizzard || night || dusk || state.meters.warmth < 40) must.push(fire);
      else if (rng() < 0.55) good.push(fire);
    } else if (blizzard) {
      must.push({
        id: "fire",
        label: "The blizzard eats sparks",
        disabled: true,
        hint: "Needs fatwood",
        action: { type: "makeFire" },
      });
    }
  }

  if (!shelter && (blizzard || state.weather === "snow" || night)) {
    const hole: Choice = {
      id: "shelter",
      label: blizzard
        ? pick(rng, ["Dig a snow hole", "Bury yourself from the wind"])
        : pick(rng, ["Throw up a windbreak", "Shelter up"]),
      action: { type: "shelterUp" },
    };
    if (blizzard) must.push(hole);
    else good.push(hole);
  }

  const searchChance = blizzard
    ? 0.12
    : night
      ? 0.4
      : dawn || morning || afternoon
        ? 0.72
        : 0.4;
  if (rng() < searchChance) {
    const search: Choice = { id: "search", label: searchLabel(state, rng), action: { type: "search" } };
    if (dawn || morning) good.push(search);
    else flavor.push(search);
  }

  const huntOk =
    tags.includes("game") &&
    !blizzard &&
    (dawn || dusk || morning || (afternoon && rng() < 0.35));
  if (huntOk) {
    good.push({
      id: "hunt",
      label: huntLabel(state, rng),
      hint: state.inventory.rifle && state.inventory.powder > 0 ? "Eye, costs powder" : "Hands / still-hunt",
      action: { type: "hunt" },
    });
  }

  const fishOk = FISH_PLACES.has(state.locationId) && !blizzard && !night;
  if (fishOk && rng() < (morning || afternoon ? 0.75 : 0.45)) {
    good.push({
      id: "fish",
      label: fishLabel(state, rng),
      hint: state.season === "winter" || state.weather === "snow" ? "Hands" : undefined,
      action: { type: "fish" },
    });
  }

  const scoutChance = dawn ? 0.8 : night ? 0.55 : blizzard ? 0.15 : 0.45;
  if (rng() < scoutChance) {
    const scout: Choice = {
      id: "scout",
      label: scoutLabel(state, rng),
      hint: "Savvy",
      action: { type: "scout" },
    };
    if (dawn) good.push(scout);
    else flavor.push(scout);
  }

  const mendOk = shelter || state.campfire || afternoon;
  if (mendOk && !blizzard && rng() < 0.5) {
    flavor.push({
      id: "mend",
      label: pick(rng, ["Mend kit", "Dry the boots", "Rub down the rifle"]),
      action: { type: "mend" },
    });
  }

  const snareOk = tags.includes("game") && tags.includes("wood") && morning && !blizzard;
  if (snareOk && rng() < 0.7) {
    good.push({
      id: "snares",
      label: pick(rng, ["Check snares", "Walk the snare line", "Look to the sets"]),
      action: { type: "checkSnares" },
    });
  }

  const canCache =
    state.inventory.rations >= 2 &&
    (shelter || state.locationId === "cache-deadfall" || state.locationId === "talus-ice-cave");
  if (canCache && !night && rng() < 0.4) {
    flavor.push({
      id: "cache",
      label:
        state.locationId === "cache-deadfall"
          ? "Bury meat in the deadfall"
          : state.locationId === "talus-ice-cave"
            ? "Hang meat in the ice"
            : pick(rng, ["Cache a day’s meat", "Bury meat against later"]),
      action: { type: "cache" },
    });
  }

  if ((dusk || night) && !blizzard && rng() < 0.28) {
    flavor.push({
      id: "pray",
      label: pick(rng, ["Sing under your breath", "Talk to yourself", "Say a scrap of prayer"]),
      action: { type: "pray" },
    });
  }

  if (tags.includes("water") || state.locationId === "hot-spring" || state.locationId === "creek") {
    const water: Choice = { id: "water", label: waterLabel(state, rng), action: { type: "gatherWater" } };
    if (state.inventory.water < 2 || parched) good.push(water);
    else if (rng() < 0.55) flavor.push(water);
  }
  const campActs = campMenuChoices(state, rng);
  for (const c of campActs.must) must.push(c);
  for (const c of campActs.good) good.push(c);
  for (const c of campActs.flavor) flavor.push(c);

  if (tags.includes("wood")) {
    const woodHard = night || blizzard;
    const wood: Choice = {
      id: "wood",
      label: woodLabel(state, rng),
      hint: woodHard ? "Hands" : undefined,
      action: { type: "gatherWood" },
    };
    if (blizzard && !state.campfire) must.push(wood);
    else if (state.inventory.firewood < 2) good.push(wood);
    else if (rng() < (woodHard ? 0.35 : 0.55)) flavor.push(wood);
  }

  const camp: Choice[] = [];
  const seen = new Set<string>();
  const take = (c: Choice) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    camp.push(c);
  };
  for (const c of must) take(c);
  for (const c of good) take(c);
  for (const c of flavor) take(c);

  const travels = pickTravelEdges(state, rng).map((edge) => ({
    id: `go-${edge.to}`,
    label: travelLabel(state, edge.to, edge.trailName, rng),
    hint: `${edge.hours}+ hours`,
    action: { type: "travel" as const, to: edge.to },
    tier: "travel" as const,
  }));

  return tagCampTiers(state, [...camp, ...travels]);
}

function tagCampTiers(state: GameState, choices: Choice[]): Choice[] {
  const starving = state.meters.hunger < 30;
  const parched = state.meters.thirst < 30;
  const blizzard = state.weather === "blizzard";
  const band = timeBand(state.hour);
  const night = band === "night";
  const dusk = band === "dusk";
  const exhausted = state.meters.energy < 35;
  return choices.map((c) => {
    if (c.tier) return c;
    const t = c.action.type;
    if (t === "travel") return { ...c, tier: "travel" };
    if (
      t === "wait" ||
      t === "talk" ||
      t === "hunt" ||
      t === "fish" ||
      t === "scout" ||
      t === "pitchCamp"
    ) {
      return { ...c, tier: "hero" };
    }
    if (t === "eat" && starving) return { ...c, tier: "hero" };
    if (t === "drink" && parched) return { ...c, tier: "hero" };
    if (t === "sleep" && (night || exhausted || blizzard)) return { ...c, tier: "hero" };
    if ((t === "makeFire" || t === "tendFire") && (blizzard || night || dusk || state.meters.warmth < 40)) {
      return { ...c, tier: "hero" };
    }
    if (t === "shelterUp" && blizzard) return { ...c, tier: "hero" };
    return { ...c, tier: "routine" };
  });
}

export function hasShelter(state: GameState): boolean {
  const loc = LOCATION_BY_ID[state.locationId];
  return Boolean(
    loc?.tags.includes("shelter") ||
      state.locationId === "high-camp" ||
      state.inventory.extras.includes("snow-hole") ||
      (state.camp?.leanTo && state.camp.locationId === state.locationId),
  );
}
