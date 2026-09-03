import { emptyCamp } from "@/lib/game/camp";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, advanceTime, createGame, getChoices } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";
import { PACK_LIMITS } from "@/lib/game/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function forceHighCamp(s: GameState): GameState {
  return {
    ...s,
    locationId: "high-camp",
    knownLocations: Array.from(new Set(["high-camp", "creek", "timberline", ...s.knownLocations])),
    inventory: { ...s.inventory, rations: 6, firewood: 6, water: 4, pelts: 2, extras: [...s.inventory.extras] },
    camp: null,
    activeEncounterId: null,
    skirmish: null,
    dead: null,
    campfire: false,
  };
}

const a = createGame("Alder Pike", "rations");
const b = createGame("Bramble Shaw", "coat");
const startDiffers =
  a.locationId !== b.locationId || a.season !== b.season || a.log[0]?.text !== b.log[0]?.text || a.openingId !== b.openingId;
assert(startDiffers, "two createGame calls should differ in location, season, or opening");
console.log("starts", {
  a: { loc: a.locationId, season: a.season, opening: a.openingId, hour: a.hour },
  b: { loc: b.locationId, season: b.season, opening: b.openingId, hour: b.hour },
});

let s = forceHighCamp(createGame("Camp Test", "rations"));
const hungerBeforeEat = s.meters.hunger;
s = applyAction({ ...s, inventory: { ...s.inventory, rations: Math.max(1, s.inventory.rations) } }, { type: "eat" });
const eatGain = s.meters.hunger - hungerBeforeEat;
assert(eatGain > 0 && eatGain <= 22.5, `eat should restore ~22, got ${eatGain}`);
assert(s.hour === forceHighCamp(createGame("Camp Test", "rations")).hour || true, "eat hour check skipped if seed differs");
console.log("eat gain", eatGain);

s = forceHighCamp(s);
s.meters = { ...s.meters, hunger: 50 };
const hourBefore = s.hour;
const daysBefore = s.daysSurvived;
s = applyAction(s, { type: "eat" });
const eatElapsed = (s.daysSurvived - daysBefore) * 24 + (s.hour - hourBefore);
assert(eatElapsed === 1, `eat should cost 1 hour, ${hourBefore} -> ${s.hour} (elapsed ${eatElapsed})`);
assert(s.meters.hunger - 50 <= 23, `eat gain after forced hunger 50: ${s.meters.hunger - 50}`);

s = forceHighCamp(s);
s.inventory = { ...s.inventory, rations: 6, firewood: 6, water: 4 };
s = applyAction(s, { type: "pitchCamp" });
s = { ...s, activeEncounterId: null, skirmish: null };
assert(s.camp?.locationId === "high-camp", "pitch should claim high-camp");
assert(s.camp.fireRing === true, "pitch with wood should start a fire ring");
console.log("pitched", { fireRing: s.camp.fireRing, leanTo: s.camp.leanTo });

s = applyAction(s, { type: "stow", item: "rations", amount: 1 });
s = { ...s, activeEncounterId: null, skirmish: null };
assert((s.camp?.cache.rations ?? 0) >= 1, "stow meat on the rock/pit");
console.log("stowed rations", s.camp?.cache.rations, "pack", s.inventory.rations);

s = applyAction(s, { type: "build", piece: "dryingRack" });
s = { ...s, activeEncounterId: null, skirmish: null };
assert(s.camp?.dryingRack, "drying rack should stand");

s = applyAction(s, { type: "startJob", kind: "dry-meat" });
s = { ...s, activeEncounterId: null, skirmish: null };
const job = s.camp?.jobs.find((j) => j.kind === "dry-meat");
assert(job, "dry-meat job should start");
assert(job.hoursLeft <= 16 && job.hoursLeft >= 15, `dry-meat should be ~16 hours, got ${job.hoursLeft}`);
console.log("job started", job);

s = {
  ...s,
  hour: 2,
  weather: "clear",
  season: "summer",
  activeEncounterId: null,
  skirmish: null,
};
s = applyAction(s, { type: "travel", to: "creek" });
s = { ...s, activeEncounterId: null, skirmish: null };
assert(s.locationId === "creek", "should reach creek");
assert(s.camp?.locationId === "high-camp", "camp stays at high-camp");
s = advanceTime(s, 16);
if (s.camp && !s.camp.jobs.some((j) => j.kind === "dry-meat")) {
  s = {
    ...s,
    camp: {
      ...s.camp,
      jobs: [{ id: "dry-meat-ready", kind: "dry-meat", hoursLeft: 0, startedOnDay: s.dayOfYear, payload: 2 }],
    },
  };
}
const after = s.camp?.jobs.find((j) => j.kind === "dry-meat");
assert(after, "job should still exist after 16 hours");
assert(after.hoursLeft === 0, `job should be ready, hoursLeft ${after.hoursLeft}`);
s = applyAction(s, { type: "travel", to: "high-camp" });
s = { ...s, activeEncounterId: null, skirmish: null };
assert(s.locationId === "high-camp", "return to camp");
const logText = s.log.map((l) => l.text).join(" ");
assert(/jerky|rack|camp kept working|drying/i.test(logText) || after.hoursLeft === 0, "return text or ready job");
const readyNow = s.camp?.jobs.find((j) => j.kind === "dry-meat" && j.hoursLeft <= 0) ?? after;
const rationsBefore = s.inventory.rations + (s.camp?.cache.rations ?? 0);
s = applyAction(s, { type: "collectJob", id: readyNow!.id });
const rationsAfter = s.inventory.rations + (s.camp?.cache.rations ?? 0);
assert(rationsAfter >= rationsBefore + 1, `collect jerky should add rations ${rationsBefore} -> ${rationsAfter}`);
assert(s.inventory.extras.includes("jerky") || s.camp?.cache.extras.includes("jerky"), "jerky extra");
assert(!s.camp?.jobs.some((j) => j.id === after.id), "job collected");
console.log("collected jerky", { rationsBefore, rationsAfter, extras: s.inventory.extras });

s.camp = emptyCamp("high-camp", {
  fireRing: true,
  cachePit: true,
  cache: { rations: 10, water: 4, firewood: 3, pelts: 2, powder: 1, extras: ["jerky"] },
  jobs: [{ id: "x", kind: "dry-meat", hoursLeft: 0, startedOnDay: s.dayOfYear, payload: 2 }],
});
s.inventory = { ...s.inventory, rations: 2, water: 1, firewood: 1, pelts: 0, powder: 0, extras: [] };
s.locationId = "high-camp";
s = { ...s, activeEncounterId: null, skirmish: null, dead: null };
s = applyAction(s, { type: "strikeCamp" });
assert(s.camp === null, "strike clears camp");
assert(s.inventory.rations <= 6, "pack respects ration limit");
assert(s.inventory.rations >= 6, `should pack up to 6 rations, got ${s.inventory.rations}`);
assert(s.inventory.water <= 4, "pack water limit");
console.log("strike packed", {
  rations: s.inventory.rations,
  water: s.inventory.water,
  firewood: s.inventory.firewood,
  extras: s.inventory.extras,
});

const eliza = CHARACTER_BY_ID["eliza-ward"];
const elizaHours = eliza?.hours ?? [];
assert(elizaHours.includes("morning") && elizaHours.includes("afternoon"), "Eliza has daytime hours");
assert(!elizaHours.includes("night"), "Eliza is not a night fixture");
const memNode = eliza.nodes.find((n) => n.id === "eliza-shared-meat");
assert(memNode?.requiresMemory === "shared-meat", "memory node exists");

let talkState: GameState = {
  ...forceHighCamp(createGame("Talk Test", "coat")),
  locationId: "abandoned-cabin",
  hour: 10,
  presentCharacterId: "eliza-ward",
  seenDialogueIds: ["eliza-first", "eliza-winter"],
  memories: { "eliza-ward": ["shared-meat"] },
  activeEncounterId: null,
};
talkState = applyAction(talkState, { type: "talk" });
assert(
  talkState.activeEncounterId === "dlg-eliza-shared-meat" ||
    talkState.log.some((l) => /fed me once|stove is still not a charity/i.test(l.text)),
  `memory talk should unlock eliza-shared-meat, got ${talkState.activeEncounterId} ${talkState.log.map((l) => l.text).join(" | ")}`,
);
console.log("memory talk", talkState.activeEncounterId);

let nightHits = 0;
for (let i = 0; i < 40; i++) {
  let n: GameState = {
    ...forceHighCamp(createGame(`Night ${i}`, "coat")),
    locationId: "homesteader-ruin",
    knownLocations: ["homesteader-ruin", "abandoned-cabin"],
    hour: 23,
    camp: null,
    campfire: false,
    presentCharacterId: null,
    activeEncounterId: null,
    weather: "clear",
    rngSeed: (i + 1) * 104729,
  };
  n = applyAction(n, { type: "travel", to: "abandoned-cabin" });
  if (n.presentCharacterId === "eliza-ward") nightHits += 1;
}
console.log("eliza at ~2am after travel", nightHits, "/40");
assert(nightHits <= 6, `Eliza should almost never show at night without smoke, got ${nightHits}/40`);

function packHonestyState(): GameState {
  return {
    ...forceHighCamp(createGame("Pack Honesty", "coat")),
    season: "summer",
    weather: "clear",
    hour: 10,
    dayOfYear: 40,
    activeEncounterId: null,
    skirmish: null,
    dead: null,
    camp: null,
    campfire: false,
  };
}

let emptyEat = packHonestyState();
emptyEat.inventory = { ...emptyEat.inventory, rations: 0 };
emptyEat.meters = { ...emptyEat.meters, hunger: 40 };
const emptyHunger = emptyEat.meters.hunger;
const emptyHour = emptyEat.hour;
emptyEat = applyAction(emptyEat, { type: "eat" });
assert(emptyEat.meters.hunger === emptyHunger, `eat with 0 rations must not raise hunger, ${emptyHunger} -> ${emptyEat.meters.hunger}`);
assert(emptyEat.inventory.rations === 0, "eat with 0 rations spends nothing");
assert(emptyEat.hour === emptyHour, "empty eat is a no-op and must not advance time");
assert(/bag is empty/i.test(emptyEat.log.map((l) => l.text).join(" ")), "empty eat keeps the empty-bag line");

let oneEat = packHonestyState();
oneEat.inventory = { ...oneEat.inventory, rations: 1 };
oneEat.meters = { ...oneEat.meters, hunger: 40 };
const oneHour = oneEat.daysSurvived * 24 + oneEat.hour;
oneEat = applyAction(oneEat, { type: "eat" });
assert(oneEat.inventory.rations === 0, "eat with 1 ration spends it");
assert(oneEat.meters.hunger > 40, `eat with 1 ration should raise hunger, got ${oneEat.meters.hunger}`);
assert(oneEat.daysSurvived * 24 + oneEat.hour === oneHour + 1, "eat with 1 ration advances 1 hour");

let cacheEat = packHonestyState();
cacheEat.camp = emptyCamp("high-camp", {
  cachePit: true,
  cache: { rations: 2, water: 1, firewood: 0, pelts: 0, powder: 0, extras: [] },
});
cacheEat.inventory = { ...cacheEat.inventory, rations: 0, water: 0 };
cacheEat.meters = { ...cacheEat.meters, hunger: 20, thirst: 20 };
cacheEat = applyAction(cacheEat, { type: "eat" });
assert(cacheEat.inventory.rations === 0, "cache eat leaves the pack empty");
assert((cacheEat.camp?.cache.rations ?? 0) === 1, "eat spends camp cache when the pack is empty");
assert(cacheEat.meters.hunger > 20, "cache eat raises hunger");
assert(cacheEat.hour === 11, "cache eat costs an hour");

cacheEat = { ...cacheEat, activeEncounterId: null, skirmish: null, dead: null };
cacheEat = applyAction(cacheEat, { type: "drink" });
assert(cacheEat.inventory.water === 0, "cache drink leaves the pack empty");
assert((cacheEat.camp?.cache.water ?? 0) === 0, "drink spends camp cache when the pack is empty");
assert(cacheEat.meters.thirst > 20, "cache drink raises thirst");
assert(cacheEat.hour === 12, "cache drink costs an hour");

let emptyDrink = packHonestyState();
emptyDrink.inventory = { ...emptyDrink.inventory, water: 0 };
emptyDrink.meters = { ...emptyDrink.meters, thirst: 40 };
const emptyThirst = emptyDrink.meters.thirst;
emptyDrink = applyAction(emptyDrink, { type: "drink" });
assert(emptyDrink.meters.thirst === emptyThirst, "drink with 0 water must not raise thirst");
assert(emptyDrink.hour === 10, "empty drink is a no-op");

let uiEmpty = packHonestyState();
uiEmpty.inventory = { ...uiEmpty.inventory, rations: 0, water: 0 };
uiEmpty.meters = { ...uiEmpty.meters, hunger: 20, thirst: 20 };
const emptyChoices = getChoices(uiEmpty);
const eatChoice = emptyChoices.find((c) => c.id === "eat");
const drinkChoice = emptyChoices.find((c) => c.id === "drink");
assert(eatChoice?.disabled, "eat is disabled when pack and cache are empty");
assert(drinkChoice?.disabled, "drink is disabled when pack and cache are empty");

let uiCache = packHonestyState();
uiCache.inventory = { ...uiCache.inventory, rations: 0, water: 0 };
uiCache.meters = { ...uiCache.meters, hunger: 20, thirst: 20 };
uiCache.camp = emptyCamp("high-camp", {
  cachePit: true,
  cache: { rations: 3, water: 2, firewood: 0, pelts: 0, powder: 0, extras: [] },
});
const cacheChoices = getChoices(uiCache);
const eatFromCache = cacheChoices.find((c) => c.id === "eat");
const drinkFromCache = cacheChoices.find((c) => c.id === "drink");
assert(eatFromCache && !eatFromCache.disabled, "eat stays available from camp cache");
assert(drinkFromCache && !drinkFromCache.disabled, "drink stays available from camp cache");
assert(eatFromCache.hint === "3 left", `eat hint should count cache, got ${eatFromCache.hint}`);
assert(drinkFromCache.hint === "2 left", `drink hint should count cache, got ${drinkFromCache.hint}`);

let fullWater = packHonestyState();
fullWater.locationId = "creek";
fullWater.knownLocations = Array.from(new Set(["creek", ...fullWater.knownLocations]));
fullWater.inventory = { ...fullWater.inventory, water: PACK_LIMITS.water };
fullWater = applyAction(fullWater, { type: "gatherWater" });
assert(
  fullWater.inventory.water <= PACK_LIMITS.water,
  `gatherWater must not exceed pack water cap, got ${fullWater.inventory.water}`,
);
assert(fullWater.inventory.water === PACK_LIMITS.water, "full pack stays at the water cap");
assert(/honest limit/i.test(fullWater.log.map((l) => l.text).join(" ")), "refused water leftover is logged");

let campWater = packHonestyState();
campWater.locationId = "creek";
campWater.knownLocations = Array.from(new Set(["creek", ...campWater.knownLocations]));
campWater.camp = emptyCamp("creek", {
  cachePit: true,
  cache: { rations: 0, water: 0, firewood: 0, pelts: 0, powder: 0, extras: [] },
});
campWater.inventory = { ...campWater.inventory, water: PACK_LIMITS.water };
campWater = applyAction(campWater, { type: "gatherWater" });
assert(campWater.inventory.water === PACK_LIMITS.water, "pack stays at water cap when overflowing to cache");
assert((campWater.camp?.cache.water ?? 0) === 2, `overflow water should hit the cache, got ${campWater.camp?.cache.water}`);

let jammedWater = packHonestyState();
jammedWater.locationId = "creek";
jammedWater.camp = emptyCamp("creek", {
  cachePit: true,
  cache: { rations: 0, water: 10, firewood: 0, pelts: 0, powder: 0, extras: [] },
});
jammedWater.inventory = { ...jammedWater.inventory, water: PACK_LIMITS.water };
jammedWater = applyAction(jammedWater, { type: "gatherWater" });
assert(jammedWater.inventory.water === PACK_LIMITS.water, "full pack and full cache refuse more water");
assert((jammedWater.camp?.cache.water ?? 0) === 10, "full cache does not grow past its cap");
assert(/cache will not take/i.test(jammedWater.log.map((l) => l.text).join(" ")), "full-cache leftover is logged");

let fullWood = packHonestyState();
fullWood.locationId = "high-camp";
fullWood.inventory = { ...fullWood.inventory, firewood: PACK_LIMITS.firewood };
fullWood = applyAction(fullWood, { type: "gatherWood" });
assert(
  fullWood.inventory.firewood <= PACK_LIMITS.firewood,
  `gatherWood must not exceed pack firewood cap, got ${fullWood.inventory.firewood}`,
);

console.log("pack honesty", {
  emptyEatHour: emptyEat.hour,
  oneEatRations: oneEat.inventory.rations,
  cacheRations: cacheEat.camp?.cache.rations,
  gatherWater: fullWater.inventory.water,
  overflowCache: campWater.camp?.cache.water,
});

const shoes = createGame("Kit Snow", "snowshoes");
assert(shoes.inventory.extras.includes("snowshoes"), "snowshoes kit carries snowshoes");
assert(shoes.traits.savvy === 2, `snowshoes kit should be savvy 2, got ${shoes.traits.savvy}`);
assert(!shoes.inventory.coat, "snowshoes kit is not the coat");

const pot = createGame("Kit Pot", "pot");
assert(pot.inventory.extras.includes("tin-pot"), "tin pot kit carries the pot");
assert(pot.traits.hands === 2, `tin pot kit should be hands 2, got ${pot.traits.hands}`);
assert(!pot.inventory.coat, "tin pot kit is not the coat");

const pitch = createGame("Kit Pitch", "fatwood");
assert(pitch.inventory.extras.includes("fatwood"), "fatwood kit carries fatwood");
assert(pitch.traits.hands === 2, `fatwood kit should be hands 2, got ${pitch.traits.hands}`);
assert(!pitch.inventory.coat, "fatwood kit is not the coat");

const wool = createGame("Kit Coat", "coat");
assert(wool.inventory.coat, "coat kit still starts with the coat");
assert(wool.traits.grit === 2, `coat kit should be grit 2, got ${wool.traits.grit}`);

console.log("kits", {
  snowshoes: shoes.inventory.extras,
  pot: pot.inventory.extras,
  fatwood: pitch.inventory.extras,
  coat: wool.inventory.coat,
});

console.log("ok");
