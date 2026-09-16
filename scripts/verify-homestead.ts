import { applyAction, createGame } from "@/lib/game/engine";
import { campStageModel, canRaise, dwellingLine, hasWork, homesteadLookBook } from "@/lib/game/homestead";
import type { GameState, HomesteadWorkId } from "@/lib/game/types";

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

function stock(state: GameState): GameState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      firewood: 6,
      logs: 8,
      stone: 8,
      pelts: 4,
      extras: Array.from(new Set([...state.inventory.extras, "axe", "adze", "auger"])),
    },
  };
}

function finishKind(state: GameState, kind: HomesteadWorkId): GameState {
  assert(state.camp, `camp before finish ${kind}`);
  const zeroed: GameState = {
    ...state,
    camp: {
      ...state.camp,
      jobs: state.camp.jobs.map((j) => (j.kind === kind ? { ...j, hoursLeft: 0 } : j)),
    },
  };
  const job = zeroed.camp!.jobs.find((j) => j.kind === kind);
  assert(job, `job ${kind}`);
  return idle(applyAction(zeroed, { type: "collectJob", id: job.id }));
}

const empty = campStageModel(null);
assert(!empty.platform && empty.wallCount === 0 && empty.silhouette.length === 0, "empty model");
assert(empty.dwellingLine === "", "empty line");

let m = idle(createGame("Homestead Model", "coat"));
m.locationId = "creek";
m.knownLocations = ["creek", "high-camp"];
m.camp = null;
m = stock(m);
m = idle(applyAction(m, { type: "pitchCamp" }));
assert(m.camp?.locationId === "creek", "model pitch");

m = idle(applyAction(m, { type: "raise", work: "platform" }));
m = finishKind(m, "platform");
let stage = campStageModel(m);
assert(stage.platform, "model platform");
assert(stage.silhouette.includes("platform"), "silhouette platform");
assert(!stage.silhouette.includes("walls"), "no wall silhouette yet");
assert(stage.dwellingLine === dwellingLine(m.camp!), "dwellingLine bind after platform");
assert(campStageModel(m.camp!).platform, "model from camp");
assert(stage.silhouette.every((k) => !k.includes("/") && !k.includes(".")), "silhouette keys are not art files");

m = stock(m);
m = idle(applyAction(m, { type: "raise", work: "wall-wind" }));
m = finishKind(m, "wall-wind");
stage = campStageModel(m);
assert(stage.platform && stage.wallCount >= 1 && stage.walls.wind, "one wall");
assert(stage.silhouette.includes("walls"), "silhouette walls");
assert(stage.dwellingLine === dwellingLine(m.camp!), "dwellingLine bind after wall");

const midRows = homesteadLookBook(m);
assert(
  midRows.some((r) => r.available) || midRows.some((r) => !r.available && r.reason),
  "lookbook has available or blocked-with-reason on mid-build camp",
);
const roofRow = midRows.find((r) => r.id === "raise-roof");
assert(roofRow && !roofRow.available && roofRow.reason, "roof is blocked next with reason");
assert(/wall/i.test(roofRow.reason!), roofRow.reason);
assert(
  midRows.some((r) => r.available && r.id.startsWith("raise-wall-")),
  "remaining walls are available mid-build",
);
for (const row of midRows) {
  assert(row.id && row.label && row.cost && row.command && typeof row.available === "boolean", "row shape");
  if (!row.available) assert(row.reason, `${row.id} blocked without reason`);
}

m = stock(m);
m = idle(applyAction(m, { type: "raise", work: "roof" }));
assert(!m.camp?.jobs.some((j) => j.kind === "roof") && !m.camp?.roof, "roof does not start at one wall");

for (const wall of ["wall-creek", "wall-timber", "wall-pass"] as const) {
  m = stock(m);
  m = idle(applyAction(m, { type: "raise", work: wall }));
  m = finishKind(m, wall);
}
stage = campStageModel(m);
assert(stage.wallCount === 4, "four walls before roof");

m = stock(m);
m = idle(applyAction(m, { type: "raise", work: "roof" }));
assert(m.camp?.jobs.some((j) => j.kind === "roof"), "roof job starts after four walls");
m = finishKind(m, "roof");
stage = campStageModel(m);
assert(stage.roof, "roof stands");
assert(stage.silhouette.includes("roof"), "silhouette roof");
assert(stage.dwellingLine === dwellingLine(m.camp!), "dwellingLine bind after roof");
assert(JSON.stringify(campStageModel(m).silhouette) === JSON.stringify(campStageModel(m.camp!).silhouette), "state and camp models match");

console.log("homestead ok", {
  line: dwellingLine(s.camp!),
  locked: s.camp?.locked,
  loc: s.camp?.locationId,
  model: stage.dwellingLine,
  silhouette: stage.silhouette,
  midLook: { available: midRows.filter((r) => r.available).length, blocked: midRows.filter((r) => !r.available).length, roof: roofRow.reason },
});
