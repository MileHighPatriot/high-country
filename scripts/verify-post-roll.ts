import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, createGame, getChoices } from "@/lib/game/engine";
import { isLeftoverActMaze, isSoftFollowUpLabel } from "@/lib/game/gm";
import { isLiveTalk, liveTalkId, npcNeed } from "@/lib/game/talk";
import type { CharacterId, EncounterDef, GameState, PersonNeed } from "@/lib/game/types";
import { placePerson } from "@/lib/game/world";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function journal(state: GameState) {
  return state.log.map((e) => e.text).join("\n");
}

function isRollMathLine(text: string) {
  return /(?:^|.+ — )d20 \d+ \+ \S+ .+ = -?\d+ vs DC \d+ — (success|fail)\.?$/i.test(text.trim());
}

function leftoverMazes(state: GameState): EncounterDef[] {
  return (state.generatedEncounters ?? []).filter((e) => isLeftoverActMaze(e));
}

function idleAt(state: GameState, locationId: GameState["locationId"]): GameState {
  return {
    ...state,
    locationId,
    knownLocations: Array.from(
      new Set([locationId, "high-camp", "creek", "timberline", "wind-saddle", "abandoned-cabin", ...state.knownLocations]),
    ),
    activeEncounterId: null,
    pendingRoll: null,
    skirmish: null,
    waitScene: null,
    dead: null,
    weather: "snow",
    season: "winter",
    hour: 10,
    meters: { hunger: 80, thirst: 80, warmth: 72, energy: 82, health: 90 },
    inventory: {
      ...state.inventory,
      rations: Math.max(2, state.inventory.rations),
      water: Math.max(2, state.inventory.water),
      firewood: Math.max(2, state.inventory.firewood),
      extras: [...state.inventory.extras],
    },
  };
}

function seat(state: GameState, id: CharacterId, need: PersonNeed): GameState {
  let next = placePerson(state, id, state.locationId);
  const life = next.world?.people[id];
  assert(life, `seat ${id}: person missing from world`);
  next = {
    ...next,
    presentCharacterId: id,
    activeEncounterId: null,
    pendingRoll: null,
    memories: {
      ...(next.memories ?? {}),
      [id]: (next.memories?.[id] ?? []).filter((t) => t !== "answered-need"),
    },
    world: {
      ...next.world!,
      people: {
        ...next.world!.people,
        [id]: { ...life, locationId: state.locationId, headingTo: null, hoursLeft: 8, need },
      },
    },
  };
  return next;
}

function throwDie(state: GameState, success = true): GameState {
  if (!state.pendingRoll || state.pendingRoll.d20 != null) return state;
  return applyAction(
    {
      ...state,
      pendingRoll: {
        ...state.pendingRoll,
        d20: success ? 18 : 2,
        success,
        total: success ? 20 : 3,
      },
    },
    { type: "finishDie" },
  );
}

function addedSince(before: GameState, after: GameState) {
  return after.log.slice(before.log.length).map((e) => e.text);
}

function assertAlwaysMoves(before: GameState, after: GameState, label: string, opts?: { stayInTalk?: boolean; nextEncounter?: string }) {
  const added = addedSince(before, after);
  const prose = added.filter((t) => t.trim().length > 20 && !isRollMathLine(t));
  assert(!after.pendingRoll, `${label}: die should be spent`);
  assert(prose.length > 0, `${label}: silent WIN/fail — no outcome prose after the roll. log:\n${journal(after)}`);
  const labels = getChoices(after).map((c) => c.label);
  assert(labels.length > 0, `${label}: dead air — no choices after the roll, got ${labels.join(" / ") || "none"}`);
  const mazeOnDock =
    Boolean(after.activeEncounterId) && leftoverMazes(after).some((e) => e.id === after.activeEncounterId);
  const onlySoft =
    labels.length > 0 &&
    labels.every((l) => isSoftFollowUpLabel(l)) &&
    Boolean(after.activeEncounterId?.startsWith("gm-"));
  assert(!mazeOnDock && !onlySoft, `${label}: soft Keep/Stay/Leave follow-up swallowed the beat, got ${labels.join(" / ")}`);
  if (opts?.stayInTalk) {
    assert(isLiveTalk(after.activeEncounterId), `${label}: NPC answer should keep live talk open, still ${after.activeEncounterId}`);
    assert(labels.length >= 2, `${label}: live talk should still offer beats, got ${labels.join(" / ")}`);
  } else if (opts?.nextEncounter) {
    assert(
      after.activeEncounterId === opts.nextEncounter || after.activeEncounterId?.endsWith(opts.nextEncounter),
      `${label}: expected next encounter ${opts.nextEncounter}, got ${after.activeEncounterId}`,
    );
  } else if (!after.activeEncounterId && !after.skirmish && !after.dead) {
    assert(
      labels.some((l) => l === "Let time pass"),
      `${label}: idle after the roll should offer Let time pass, got ${labels.join(" / ")}`,
    );
  }
}

function forceLiveTalk(state: GameState, id: CharacterId, need: PersonNeed): GameState {
  const seated = seat(state, id, need);
  return applyAction(
    {
      ...seated,
      seenDialogueIds: CHARACTER_BY_ID[id]?.nodes.map((n) => n.id) ?? [],
    },
    { type: "talk" },
  );
}

const KEEP_STAY_LEAVE: EncounterDef = {
  id: "gm-old-maze",
  repeatable: true,
  text: "The next hour is still Keep digging.",
  choices: [
    { id: "keep", label: "Keep digging", outcome: { text: "You keep at it.", hours: 1 } },
    { id: "stay", label: "Stay on this ground", outcome: { text: "You stay.", hours: 2 } },
    { id: "leave", label: "Leave the cave for now", outcome: { text: "You leave.", hours: 1 } },
  ],
};

// --- 1. NPC question answer (success and fail) always moves ---
let s = forceLiveTalk(idleAt(createGame("Ask Ward", "coat"), "high-camp"), "silas-crowe", "food");
assert(npcNeed(s, "silas-crowe") === "food", "silas is asking about meat");
assert(s.activeEncounterId === liveTalkId("silas-crowe"), `need a live talk dock for the question, got ${s.activeEncounterId}`);
const answerChoice = getChoices(s).find((c) => c.id === "answer");
assert(answerChoice, `NPC question must be a presented answer, got ${getChoices(s).map((c) => c.label).join(" / ")}`);
const asked = applyAction(s, { type: "encounterChoice", optionId: "answer" });
assert(asked.pendingRoll, "answering the NPC question must put a die on the table");
const answered = throwDie(asked, true);
assertAlwaysMoves(asked, answered, "NPC question success", { stayInTalk: true });
assert(/Silas/i.test(journal(answered)), `NPC answer must name Silas: ${journal(answered)}`);
assert(/hunger|meat|bag|eat|priest/i.test(journal(answered)), `NPC answer must actually answer the food question: ${journal(answered)}`);
assert(!isRollMathLine(answered.log.at(-1)?.text ?? ""), "last beat after a successful answer is not silent roll math");

const failArmed = applyAction(
  forceLiveTalk(idleAt(createGame("Ask Fail", "coat"), "high-camp"), "silas-crowe", "food"),
  { type: "encounterChoice", optionId: "answer" },
);
assert(failArmed.pendingRoll, "fail path still arms a die");
const answeredFail = throwDie(failArmed, false);
assertAlwaysMoves(failArmed, answeredFail, "NPC question fail", { stayInTalk: true });
assert(/pride|chews|already knew|weather/i.test(journal(answeredFail)), `fail answer still talks: ${journal(answeredFail)}`);

// --- 2. authored talk check advances to the next node ---
let cup = seat(idleAt(createGame("Cup Ward", "coat"), "high-camp"), "silas-crowe", "company");
cup = { ...cup, activeEncounterId: "dlg-silas-more", pendingRoll: null };
const cupArmed = applyAction(cup, { type: "encounterChoice", optionId: "cup" });
assert(cupArmed.pendingRoll?.optionId === "cup", "silas cup is a dramatic check");
const cupWin = throwDie(cupArmed, true);
assertAlwaysMoves(cupArmed, cupWin, "silas cup success", { nextEncounter: "silas-company" });
assert(/west|hiring|warmer|proud/i.test(journal(cupWin)), `cup success needs outcome prose: ${journal(cupWin)}`);
assert(getChoices(cupWin).length >= 2, "silas-company must present picks");

const cupFail = throwDie(applyAction({ ...cup, pendingRoll: null }, { type: "encounterChoice", optionId: "cup" }), false);
assertAlwaysMoves(cup, cupFail, "silas cup fail", { nextEncounter: "silas-company" });
assert(/pride|watch|swallow/i.test(journal(cupFail)), `cup fail needs outcome prose: ${journal(cupFail)}`);

// --- 3. encounter roll writes prose and returns idle ---
let storm = idleAt(createGame("Storm Ward", "coat"), "wind-saddle");
storm = {
  ...storm,
  season: "summer",
  weather: "storm",
  locationId: "wind-saddle",
  activeEncounterId: "sum-storm-saddle",
  pendingRoll: null,
  skirmish: null,
};
const walkArmed = applyAction(storm, { type: "encounterChoice", optionId: "walk" });
assert(walkArmed.pendingRoll?.optionId === "walk", "saddle walk arms a die");
const walkWin = throwDie(walkArmed, true);
assertAlwaysMoves(walkArmed, walkWin, "saddle walk success");
assert(/saddle|storm|soaked|ringing/i.test(journal(walkWin)), `walk success prose: ${journal(walkWin)}`);
assert(!walkWin.activeEncounterId, "saddle walk success returns to idle");

const walkFail = throwDie(applyAction({ ...storm, pendingRoll: null }, { type: "encounterChoice", optionId: "walk" }), false);
assertAlwaysMoves(storm, walkFail, "saddle walk fail");
assert(/hail|temple|rain/i.test(journal(walkFail)), `walk fail prose: ${journal(walkFail)}`);

// --- 4. no silent WIN when the check has no authored branch ---
let silent = idleAt(createGame("Silent Win", "coat"), "high-camp");
silent = {
  ...silent,
  generatedEncounters: [
    {
      id: "gm-silent-win",
      repeatable: true,
      text: "A quiet stake. The mountain waits to see if you hold.",
      choices: [{ id: "push", label: "Hold the hour", check: { trait: "savvy", dc: 12 } }],
    },
  ],
  activeEncounterId: "gm-silent-win",
};
const silentArmed = applyAction(silent, { type: "encounterChoice", optionId: "push" });
assert(silentArmed.pendingRoll, "branchless check still arms a die");
const silentWin = throwDie(silentArmed, true);
assertAlwaysMoves(silentArmed, silentWin, "branchless success");
assert(!isRollMathLine(silentWin.log.at(-1)?.text ?? ""), "branchless success is not a silent WIN");
assert(!silentWin.activeEncounterId, "branchless success returns to idle with camp choices");

const silentFail = throwDie(applyAction({ ...silent, pendingRoll: null }, { type: "encounterChoice", optionId: "push" }), false);
assertAlwaysMoves(silent, silentFail, "branchless fail");

// --- 5. leftover Keep/Stay/Leave maze cannot swallow the post-roll beat ---
let maze = idleAt(createGame("Maze Roll", "coat"), "high-camp");
maze = {
  ...maze,
  generatedEncounters: [
    KEEP_STAY_LEAVE,
    {
      id: "gm-contest",
      repeatable: true,
      text: "A contest. The hour wants a number.",
      choices: [
        {
          id: "push",
          label: "Push through",
          check: { trait: "grit", dc: 12 },
          success: {
            text: "You hold the hour. The contest is over.",
            hours: 1,
            followUpEncounter: "gm-old-maze",
          },
          fail: {
            text: "The contest takes you. The hour is still a fact.",
            hours: 1,
            followUpEncounter: "gm-old-maze",
          },
        },
      ],
    },
  ],
  activeEncounterId: "gm-contest",
};
const mazeArmed = applyAction(maze, { type: "encounterChoice", optionId: "push" });
const mazeWin = throwDie(mazeArmed, true);
assertAlwaysMoves(mazeArmed, mazeWin, "maze swallow success");
assert(mazeWin.activeEncounterId !== "gm-old-maze", "soft follow-up must not become the next beat");
assert(
  !(mazeWin.generatedEncounters ?? []).some((e) => e.id === "gm-old-maze"),
  "leftover Keep/Stay/Leave maze must die after the roll",
);
assert(/hold the hour|contest is over/i.test(journal(mazeWin)), `contest success prose: ${journal(mazeWin)}`);

const mazeFail = throwDie(applyAction({ ...maze, pendingRoll: null }, { type: "encounterChoice", optionId: "push" }), false);
assertAlwaysMoves(maze, mazeFail, "maze swallow fail");
assert(mazeFail.activeEncounterId !== "gm-old-maze", "fail path also clears the maze");

// --- 6. resume actions (hunt) still write a beat ---
let hunt = idleAt(createGame("Hunt Roll", "powder"), "timberline");
hunt = {
  ...hunt,
  locationId: "timberline",
  season: "fall",
  weather: "clear",
  inventory: { ...hunt.inventory, rifle: true, powder: 3 },
};
const huntArmed = applyAction(hunt, { type: "hunt" });
assert(huntArmed.pendingRoll?.resume?.type === "hunt", "hunt arms a resume die");
const huntWin = throwDie(huntArmed, true);
assertAlwaysMoves(huntArmed, huntWin, "hunt success");
assert(huntWin.inventory.powder === 2, "powder spends when the shot lands");

const huntFail = throwDie(applyAction({ ...hunt, pendingRoll: null }, { type: "hunt" }), false);
assertAlwaysMoves(hunt, huntFail, "hunt fail");

// --- 7. typed act success/fail never dead-airs ---
const pebble = idleAt(createGame("Pebble Roll", "coat"), "creek");
const pebbleArmed = applyAction(pebble, { type: "attempt", text: "I throw a pebble at a magpie" });
assert(pebbleArmed.pendingRoll, "typed act arms a die");
const pebbleWin = throwDie(pebbleArmed, true);
assertAlwaysMoves(pebbleArmed, pebbleWin, "typed pebble success");
assert(!pebbleWin.activeEncounterId, "typed act returns to idle");

const pebbleFail = throwDie(applyAction(pebble, { type: "attempt", text: "I throw a pebble at a magpie" }), false);
assertAlwaysMoves(pebble, pebbleFail, "typed pebble fail");

console.log("post-roll ok", {
  npcAnswer: answered.activeEncounterId,
  cup: cupWin.activeEncounterId,
  stormIdle: !walkWin.activeEncounterId,
  silentIdle: !silentWin.activeEncounterId,
  mazeGone: !(mazeWin.generatedEncounters ?? []).some((e) => e.id === "gm-old-maze"),
  huntPowder: huntWin.inventory.powder,
  pebbleIdle: !pebbleWin.activeEncounterId,
});
