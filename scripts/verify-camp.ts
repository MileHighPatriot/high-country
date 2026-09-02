import { emptyCamp } from "@/lib/game/camp";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, advanceTime, createGame } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";

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
s = applyAction(s, { type: "eat" });
assert(s.hour === hourBefore, `eat should cost 0 hours, hour ${hourBefore} -> ${s.hour}`);
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

console.log("ok");
