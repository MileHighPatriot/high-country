import { applyAction, createGame } from "@/lib/game/engine";
import { canRaise, dwellingLine, hasWork } from "@/lib/game/homestead";
import type { GameState } from "@/lib/game/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function idle(s: GameState): GameState {
  return { ...s, activeEncounterId: null, skirmish: null, pendingRoll: null, waitScene: null };
}

let s = idle(createGame("Homestead", "coat"));
s.locationId = "creek";
s.knownLocations = ["creek", "high-camp"];
s.camp = null;
s.inventory = { ...s.inventory, firewood: 6, logs: 8, stone: 8, pelts: 4, extras: [...s.inventory.extras, "axe", "adze", "auger"] };
s = applyAction(s, { type: "pitchCamp" });
s = idle(s);
assert(s.camp?.locationId === "creek", "pitch creek");
assert(!s.camp?.locked, "pitch does not lock");

const noPlat = canRaise(s, "roof");
assert(!noPlat.ok, "roof before platform fails");

s = applyAction(s, { type: "raise", work: "platform" });
s = idle(s);
assert(s.camp?.jobs.some((j) => j.kind === "platform"), "platform is a job");
s.camp = { ...s.camp!, jobs: s.camp!.jobs.map((j) => (j.kind === "platform" ? { ...j, hoursLeft: 0 } : j)) };
const job = s.camp.jobs.find((j) => j.kind === "platform")!;
s = applyAction(s, { type: "collectJob", id: job.id });
s = idle(s);
assert(s.camp?.platform, "platform stands");
assert(s.camp?.locked, "platform locks the bench");
assert(/locked|platform/i.test(dwellingLine(s.camp!)), dwellingLine(s.camp!));

s.locationId = "timberline";
s = applyAction(s, { type: "pitchCamp" });
assert(s.camp?.locationId === "creek", "cannot pitch a second homestead");
s.locationId = "creek";
s = applyAction(s, { type: "strikeCamp" });
s = idle(s);
assert(s.camp?.locked && s.camp.platform, "strike leaves the locked compound");

s.inventory = { ...s.inventory, logs: 8, extras: [...s.inventory.extras, "axe", "adze"] };
s = applyAction(s, { type: "raise", work: "wall-wind" });
assert(s.camp?.jobs.some((j) => j.kind === "wall-wind") || hasWork(s.camp!, "wall-wind"), "wind wall starts");

console.log("homestead ok", { line: dwellingLine(s.camp!), locked: s.camp?.locked, loc: s.camp?.locationId });
