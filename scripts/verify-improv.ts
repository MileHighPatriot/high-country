import { emptyCamp } from "@/lib/game/camp";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, createGame, getChoices } from "@/lib/game/engine";
import {
  campVerbOf,
  isLeftoverActMaze,
  isSoftFollowUpLabel,
  looksLikeTemplate,
  matchPresentedOption,
} from "@/lib/game/gm";
import { hydrateGame, parseGame, serializeGame } from "@/lib/game/save";
import { sceneNarration } from "@/lib/game/scene";
import { liveTalkId } from "@/lib/game/talk";
import type { EncounterDef, GameState } from "@/lib/game/types";

// Grok Build re-verified 2026-09-13: declare arms trait+DC, roll forks, idle camp (no Keep/Stay/Leave maze).

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function journal(state: GameState) {
  return state.log.map((e) => e.text).join("\n");
}

function idleAt(state: GameState, locationId: GameState["locationId"]): GameState {
  return {
    ...state,
    locationId,
    knownLocations: Array.from(new Set([locationId, "high-camp", "creek", "timberline", "abandoned-cabin", ...state.knownLocations])),
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

function say(state: GameState, text: string, success = true): GameState {
  return throwDie(applyAction(state, { type: "attempt", text }), success);
}

function notTemplate(text: string, label: string) {
  assert(text.trim().length > 20, `${label} too short: ${text}`);
  assert(!looksLikeTemplate(text), `${label} collapsed to a template: ${text}`);
}

function leftoverMazes(state: GameState): EncounterDef[] {
  return (state.generatedEncounters ?? []).filter((e) => isLeftoverActMaze(e));
}

function assertIdleAfterAct(state: GameState, label: string) {
  assert(!state.pendingRoll, `${label}: die should be spent`);
  assert(!state.activeEncounterId, `${label}: should return to idle, still ${state.activeEncounterId}`);
  const labels = getChoices(state).map((c) => c.label);
  assert(
    !labels.some((l) => isSoftFollowUpLabel(l)),
    `${label}: soft Keep/Stay/Leave follow-up, got ${labels.join(" / ")}`,
  );
  assert(
    leftoverMazes(state).length === 0,
    `${label}: leftover Keep/Stay/Leave maze still stored (${leftoverMazes(state)
      .map((e) => e.id)
      .join(", ")})`,
  );
  assert(
    labels.some((l) => l === "Let time pass"),
    `${label}: idle camp should offer Let time pass, got ${labels.join(" / ")}`,
  );
}

function assertDeclareThenRoll(state: GameState, text: string, label: string) {
  const before = journal(state);
  const armed = applyAction(state, { type: "attempt", text });
  assert(armed.pendingRoll, `${label}: typed act must arm a die`);
  assert(armed.pendingRoll.trait, `${label}: stake needs a trait`);
  assert(armed.pendingRoll.dc > 0, `${label}: stake needs a DC`);
  assert(armed.pendingRoll.d20 == null, `${label}: declare arms the die, it does not cast it`);
  assert(!armed.activeEncounterId, `${label}: declare must stay idle until the roll`);
  assert(journal(armed) === before, `${label}: intent-only — no outcome prose until the roll`);
  return armed;
}

// --- short camp verbs ---
assert(campVerbOf("eat") === "eat", "eat is a camp verb");
assert(campVerbOf("I go to bed") === "sleep", "go to bed sleeps");
assert(campVerbOf("rest") === "rest", "rest is a camp verb");
assert(campVerbOf("I dig a snow cave") == null, "cave is not a camp verb");

let s = idleAt(createGame("Improv Ward", "coat"), "high-camp");
s.inventory = { ...s.inventory, rations: 4 };
const ate = say(s, "eat");
assert(ate.inventory.rations === s.inventory.rations - 1 || ate.meters.hunger > s.meters.hunger, "eat still feeds");
assert(!looksLikeTemplate(journal(ate)), "eat copy is still camp copy, not attempt template");

const rested = say(s, "rest");
assert(!rested.pendingRoll, "typed rest does not leave a die on the table");
assert(!rested.activeEncounterId, "typed rest returns to idle");

// --- 1. snow cave: declare → roll → idle ---
s = idleAt(createGame("Cave Ward", "coat"), "high-camp");
const caveLine = "I dig a snow cave under the deadfall, drag my blanket in, and wait the blow out.";
const caveArmed = assertDeclareThenRoll(s, caveLine, "snow cave");
assert(!caveArmed.inventory.extras.includes("snow-hole"), "cave must not resolve before the die");
const cave = throwDie(caveArmed, true);
const caveJournal = journal(cave);
notTemplate(caveJournal, "snow cave");
assert(/vs DC \d+/i.test(caveJournal), `cave stake must log trait vs DC: ${caveJournal}`);
assert(/snow cave/i.test(caveJournal), `cave journal must name the cave: ${caveJournal}`);
assert(/deadfall/i.test(caveJournal), `cave journal must keep deadfall: ${caveJournal}`);
assert(/blanket/i.test(caveJournal), `cave journal must keep blanket: ${caveJournal}`);
assert(!/sign turns into an animal/i.test(caveJournal), "cave is not hunt copy");
assert(cave.locationId === "high-camp", "still at high camp");
assert(cave.inventory.extras.includes("snow-hole"), "cave is shelter on the body");
assert(
  (cave.storyFacts ?? []).some((f) => /snow cave/i.test(f.name) && f.locationId === "high-camp"),
  "snow cave is a story fact",
);
assertIdleAfterAct(cave, "snow cave");
assert(/cave/i.test(sceneNarration(cave)), `idle hour can still name the cave: ${sceneNarration(cave)}`);

// --- 2. drowned doe + walk trail ---
s = idleAt(createGame("Doe Ward", "coat"), "high-camp");
const beforeMeat = s.inventory.rations;
const doeLine = "I walk to Frozen Creek and cut meat from a drowned doe jammed in the ice.";
const doeArmed = assertDeclareThenRoll(s, doeLine, "drowned doe");
assert(doeArmed.locationId === "high-camp", "doe walk must not relocate before the die");
const doe = throwDie(doeArmed, true);
const doeJournal = journal(doe);
notTemplate(doeJournal, "drowned doe");
assert(/drowned doe/i.test(doeJournal), `doe must stay a doe: ${doeJournal}`);
assert(!/sign turns into an animal/i.test(doeJournal), "not hunt mad-lib");
assert(doe.locationId === "creek", `should be at Frozen Creek, got ${doe.locationId}`);
assertIdleAfterAct(doe, "drowned doe");
assert(doe.inventory.rations > beforeMeat, `meat from the doe, rations ${beforeMeat} -> ${doe.inventory.rations}`);
assert(
  (doe.storyFacts ?? []).some((f) => /doe/i.test(f.name) && f.locationId === "creek"),
  "doe remains a fact at the creek",
);
assert(/doe/i.test(sceneNarration(doe)) || (doe.storyFacts ?? []).some((f) => /doe/i.test(f.name)), "returning hour can still name the doe");

const walkArmed = assertDeclareThenRoll(idleAt(createGame("Walker", "coat"), "high-camp"), "walk to Frozen Creek", "walk trail");
assert(walkArmed.locationId === "high-camp", "walk must not land before the die");
const walkOnly = throwDie(walkArmed, true);
assert(walkOnly.locationId === "creek", `walk lands at creek, got ${walkOnly.locationId}`);
assertIdleAfterAct(walkOnly, "walk trail");

const walkFail = say(idleAt(createGame("Walker Fail", "coat"), "high-camp"), "walk to Frozen Creek", false);
assert(walkFail.locationId === "creek", `failed walk still resolves the trail, got ${walkFail.locationId}`);
assertIdleAfterAct(walkFail, "failed walk");

// --- 3. mid canned encounter, type off-script ---
s = idleAt(createGame("Song Ward", "fatwood"), "abandoned-cabin");
s = {
  ...s,
  presentCharacterId: "eliza-ward",
  seenDialogueIds: [],
  inventory: { ...s.inventory, extras: Array.from(new Set([...s.inventory.extras, "fatwood"])) },
};
s = applyAction(s, { type: "talk" });
assert(s.activeEncounterId, "eliza should open a canned beat");
const cannedId = s.activeEncounterId;
const cannedLabels = getChoices(s).map((c) => c.label).join(" | ");
const songLine = "I sing a French song and give her a gift of fatwood.";
const sung = say(s, songLine);
const sungJournal = journal(sung);
notTemplate(sungJournal, "french song");
assert(/french song/i.test(sungJournal), `journal must quote the song: ${sungJournal}`);
assert(!/jerks her chin/i.test(sung.log.at(-1)?.text ?? ""), "last beat is not the unused button");
assert(sung.activeEncounterId !== cannedId, `canned beat must close, still ${sung.activeEncounterId}`);
assertIdleAfterAct(sung, "french song");
assert(/french|song|fatwood/i.test(sung.log.at(-1)?.text ?? sungJournal), "new beat is about the act");
assert(
  getChoices(sung).every((c) => !cannedLabels.split(" | ").includes(c.label)),
  "next choices should not be the unused eliza buttons",
);

// --- 4. invent a person ---
s = idleAt(createGame("Absalom Ward", "coat"), "high-camp");
const meet = say(s, "I meet a trapper called Absalom Pike who owes me a kettle.");
notTemplate(journal(meet), "absalom");
assert(/Absalom Pike/i.test(journal(meet)), `must keep the name: ${journal(meet)}`);
assertIdleAfterAct(meet, "absalom");
assert(
  (meet.generatedPeople ?? []).some((p) => /absalom/i.test(p.name)),
  "generated people keeps Absalom",
);
assert(
  meet.world?.people && Object.values(meet.world.people).some((p) => /absalom/i.test(p.id) || p.generated),
  "Absalom is on the range",
);
assert((meet.world?.rumors ?? []).some((r) => /absalom|kettle/i.test(r)), "a rumor remembers him");
const raw = serializeGame(meet);
const loaded = parseGame(raw);
assert(loaded, "save parses");
const revived = hydrateGame(loaded!);
assert(
  (revived.generatedPeople ?? []).some((p) => /absalom/i.test(p.name)),
  "Absalom survives save/reload",
);
assert(
  (revived.storyFacts ?? []).some((f) => /absalom|kettle/i.test(`${f.name} ${f.note}`)),
  "kettle/absalom fact survives save",
);

// --- 5. presented option in own words ---
s = idleAt(createGame("Wood Ward", "coat"), "abandoned-cabin");
s = { ...s, presentCharacterId: "eliza-ward", seenDialogueIds: [] };
s = applyAction(s, { type: "talk" });
const work = CHARACTER_BY_ID["eliza-ward"]?.nodes.find((n) => n.id === "eliza-first")?.choices.find((c) => c.id === "work");
assert(work, "eliza work option exists");
assert(matchPresentedOption("I'll cut wood for a night inside", [work!]), "own words match the wood option");
assert(
  !matchPresentedOption("I go to bed", [work!]),
  "go to bed must not snag the wood option by token overlap",
);
const own = say(s, "I'll cut wood for a night inside.");
const ownJournal = journal(own);
assert(/cut wood for a night inside/i.test(ownJournal), `prose is mine: ${ownJournal}`);
assert(!/jerks her chin at the axe/i.test(ownJournal), "not the button blurb");
assert((own.standing["eliza-ward"] ?? 0) >= 1, "same standing cost/reward as the button");
assert(own.meters.warmth > s.meters.warmth || own.inventory.firewood >= s.inventory.firewood, "same work pays");

// unique copy across two different acts
assert(!/you try:/i.test(caveJournal + doeJournal + sungJournal), "never You try:");
assert(caveJournal !== doeJournal, "cave and doe are not the same paragraph");

// generated talk still works
const talkAbsalom = applyAction({ ...revived, activeEncounterId: null, pendingRoll: null, presentCharacterId: revived.presentCharacterId }, { type: "talk" });
assert(
  talkAbsalom.activeEncounterId === liveTalkId(revived.presentCharacterId ?? "") ||
    (talkAbsalom.activeEncounterId && talkAbsalom.activeEncounterId.startsWith("gm-")) ||
    /absalom/i.test(journal(talkAbsalom)),
  "later hour can still refer to Absalom",
);

// --- typed firewood at the creek actually changes the run ---
s = idleAt(createGame("Wood Walk", "coat"), "creek");
const woodBefore = s.inventory.firewood;
const woodWalk = say(s, "walk around and find some firewood");
const woodJournal = journal(woodWalk);
notTemplate(woodJournal, "creek firewood");
assert(/firewood/i.test(woodJournal), `must name firewood: ${woodJournal}`);
assert(!/the act/i.test(woodJournal), `must not collapse to "the act": ${woodJournal}`);
assert(woodWalk.inventory.firewood > woodBefore, `firewood must go up, ${woodBefore} -> ${woodWalk.inventory.firewood}`);
assert(
  (woodWalk.storyFacts ?? []).some((f) => /firewood/i.test(f.name)),
  "firewood is a story fact",
);
assertIdleAfterAct(woodWalk, "creek firewood");

// --- any sentence becomes a distinct fact, not a shared template ---
s = idleAt(createGame("Pebble", "coat"), "creek");
const pebble = say(s, "I throw a pebble at a magpie");
const carved = say(idleAt(createGame("Carve", "coat"), "creek"), "I carve my name in the ice");
notTemplate(journal(pebble), "pebble");
notTemplate(journal(carved), "carve");
assert(/pebble|magpie/i.test(journal(pebble)), `pebble/magpie must stay: ${journal(pebble)}`);
assert(/carve|name|ice/i.test(journal(carved)), `carve must stay: ${journal(carved)}`);
assert(journal(pebble) !== journal(carved), "two off-script acts must not share a paragraph");
assert(
  (pebble.storyFacts ?? []).some((f) => /pebble|magpie/i.test(`${f.name} ${f.note}`)),
  "magpie/pebble remains a fact",
);
assert(
  (carved.storyFacts ?? []).some((f) => /carve|name|ice/i.test(`${f.name} ${f.note}`)),
  "carve remains a fact",
);
assertIdleAfterAct(pebble, "pebble");
assertIdleAfterAct(carved, "carve");
assert(!/comes apart in the hands/i.test(journal(pebble)), "successful pebble is not a fail fork");
const pebbleFail = say(idleAt(createGame("Pebble Fail", "coat"), "creek"), "I throw a pebble at a magpie", false);
assert(/comes apart in the hands/i.test(journal(pebbleFail)), `pebble fail must fork: ${journal(pebbleFail)}`);
assertIdleAfterAct(pebbleFail, "pebble fail");

// --- known recipes: fire / raise ---
s = idleAt(createGame("Fire Ward", "coat"), "high-camp");
s = { ...s, campfire: false, inventory: { ...s.inventory, firewood: 4 } };
const fireArmed = assertDeclareThenRoll(s, "I make a fire", "make a fire");
assert(!fireArmed.campfire, "fire must not light before the die");
assert(fireArmed.inventory.firewood === s.inventory.firewood, "wood stays until the roll");
const lit = throwDie(fireArmed, true);
assert(lit.campfire, "successful fire recipe must light a real fire");
assert(lit.inventory.firewood < s.inventory.firewood, "successful fire spends wood");
assertIdleAfterAct(lit, "make a fire");

const fireFail = say({ ...s, campfire: false, inventory: { ...s.inventory, firewood: 4 } }, "I make a fire", false);
assert(!fireFail.campfire, "failed fire is an honest fail");
assertIdleAfterAct(fireFail, "failed fire");

s = idleAt(createGame("Raise Ward", "coat"), "high-camp");
s = {
  ...s,
  camp: emptyCamp("high-camp", { fireRing: true }),
  inventory: { ...s.inventory, logs: 8, extras: Array.from(new Set([...s.inventory.extras, "axe"])) },
};
const raiseArmed = assertDeclareThenRoll(s, "I raise a platform", "raise a platform");
assert(!raiseArmed.camp?.jobs.some((j) => j.kind === "platform"), "platform must not start before the die");
const raised = throwDie(raiseArmed, true);
assert(
  raised.camp?.jobs.some((j) => j.kind === "platform") || raised.camp?.platform,
  "successful raise recipe must start the platform",
);
assertIdleAfterAct(raised, "raise a platform");

const raiseFail = say(
  {
    ...s,
    camp: emptyCamp("high-camp", { fireRing: true }),
    inventory: { ...s.inventory, logs: 8, extras: Array.from(new Set([...s.inventory.extras, "axe"])) },
  },
  "I raise a platform",
  false,
);
assert(!raiseFail.camp?.jobs.some((j) => j.kind === "platform") && !raiseFail.camp?.platform, "failed raise does not stand");
assertIdleAfterAct(raiseFail, "failed raise");

// leftover genericEncounter maze from an earlier save must die after a typed act
s = idleAt(createGame("Maze Kill", "coat"), "high-camp");
s = {
  ...s,
  generatedEncounters: [
    {
      id: "gm-old-maze",
      repeatable: true,
      text: "The next hour is still Keep digging.",
      choices: [
        { id: "keep", label: "Keep digging", outcome: { text: "You keep at it.", hours: 1 } },
        { id: "stay", label: "Stay on this ground", outcome: { text: "You stay.", hours: 2 } },
        { id: "leave", label: "Leave the cave for now", outcome: { text: "You leave.", hours: 1 } },
      ],
    },
  ],
};
const mazeKilled = say(s, "I throw a pebble at a magpie");
assertIdleAfterAct(mazeKilled, "leftover maze");
assert(
  !(mazeKilled.generatedEncounters ?? []).some((e) => e.id === "gm-old-maze"),
  "leftover Keep/Stay/Leave maze must die after a typed act",
);

console.log("improv ok", {
  caveIdle: !cave.activeEncounterId,
  doeAt: doe.locationId,
  meat: doe.inventory.rations,
  walkAt: walkOnly.locationId,
  songClosed: cannedId,
  absalom: revived.generatedPeople?.map((p) => p.name),
  facts: revived.storyFacts?.map((f) => f.name),
  creekWood: woodWalk.inventory.firewood,
  fireLit: lit.campfire,
  platform: raised.camp?.jobs.map((j) => j.kind),
});
