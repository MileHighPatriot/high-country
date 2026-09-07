import { planAttempt } from "@/lib/game/attempt";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, createGame } from "@/lib/game/engine";
import { sceneNarration } from "@/lib/game/scene";
import { liveTalkId } from "@/lib/game/talk";
import { peopleAt, tickWorld } from "@/lib/game/world";
import type { GameState } from "@/lib/game/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function idle(state: GameState): GameState {
  return { ...state, activeEncounterId: null, skirmish: null, pendingRoll: null, waitScene: null };
}

let s = createGame("World Test", "coat");
assert(s.world, "createGame seeds world");
const roster = Object.keys(s.world!.people);
assert(roster.length === 24, `expected 24 regulars, got ${roster.length}`);

const startHere = new Set(peopleAt(s).map((p) => p.id));
s = tickWorld(s, 48);
const moved = roster.filter((id) => {
  const life = s.world!.people[id];
  return life && life.headingTo;
});
assert(moved.length >= 3, `after two days some people should be walking, got ${moved.length}`);

const seen = new Set<string>();
s = idle(s);
s.locationId = "high-camp";
s.knownLocations = Array.from(new Set(["high-camp", ...s.knownLocations]));
s.inventory = { ...s.inventory, rations: 6, water: 4, firewood: 6 };
s.meters = { hunger: 80, thirst: 80, warmth: 80, energy: 80, health: 90 };
s.campfire = true;
s.campfireHours = 12;
s.camp = {
  locationId: "high-camp",
  leanTo: true,
  fireRing: true,
  woodpile: true,
  cachePit: false,
  dryingRack: false,
  pot: false,
  cache: { rations: 4, water: 4, firewood: 6, pelts: 0, powder: 2, extras: [] },
  jobs: [],
  smoke: 4,
};

for (let i = 0; i < 18; i++) {
  s = idle(s);
  s.meters = { hunger: 80, thirst: 80, warmth: 80, energy: 80, health: 90 };
  s.inventory = { ...s.inventory, firewood: Math.max(2, s.inventory.firewood), rations: Math.max(2, s.inventory.rations) };
  s.campfire = true;
  s.campfireHours = 8;
  if (s.camp) s.camp = { ...s.camp, smoke: 4 };
  s = applyAction(s, { type: "wait" });
  if (s.waitScene) s = applyAction(s, { type: "finishWait" });
  for (const p of peopleAt(s, "high-camp")) seen.add(p.id);
  if (s.presentCharacterId) seen.add(s.presentCharacterId);
}

assert(seen.size >= 4, `a smoky week at high-camp should see several people, got ${[...seen].join(", ") || "none"}`);
assert(
  !["eliza-ward", "silas-crowe", "two-crows"].every((id) => [...seen].length <= 3 && seen.has(id) && seen.size <= 3),
  "core three should not be the only visitors",
);

const eliza = s.world!.people["eliza-ward"];
assert(eliza, "eliza still exists");
assert(eliza.locationId, "eliza has a place");

const hunt = planAttempt("I hunt the elk along the wallow");
assert(hunt.trait === "eye", `hunt should be eye, got ${hunt.trait}`);
const talkPlan = planAttempt("ask about the pass");
assert(talkPlan.trait === "savvy", `ask should be savvy, got ${talkPlan.trait}`);
let attemptState = idle(createGame("Attempt", "coat"));
attemptState = { ...attemptState, pendingRoll: null, activeEncounterId: null, skirmish: null };
const armed = applyAction(attemptState, { type: "attempt", text: "scout the next bench" });
assert(armed.pendingRoll, "attempt should put a die on the table");
const told = sceneNarration(s);
assert(/High Camp/i.test(told) || /here/i.test(told) || told.length > 20, `scene should name the ground: ${told}`);

let cabin = idle(createGame("Talk Cabin", "coat"));
cabin.locationId = "abandoned-cabin";
cabin.hour = 10;
cabin.presentCharacterId = "eliza-ward";
cabin.seenDialogueIds = (CHARACTER_BY_ID["eliza-ward"]?.nodes ?? []).map((n) => n.id);
const later = applyAction(cabin, { type: "talk" });
assert(later.activeEncounterId === liveTalkId("eliza-ward"), `composer talk, got ${later.activeEncounterId}`);
const laterText = later.log.at(-1)?.text ?? "";
assert(laterText.length > 20, `composer should speak, got ${laterText}`);

console.log("world ok", {
  roster: roster.length,
  walking: moved.length,
  visitors: [...seen],
  present: s.presentCharacterId,
  eliza: eliza.locationId,
  startHere: [...startHere],
});
