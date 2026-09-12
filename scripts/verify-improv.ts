import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, createGame, getChoices } from "@/lib/game/engine";
import { campVerbOf, looksLikeTemplate, matchPresentedOption } from "@/lib/game/gm";
import { hydrateGame, parseGame, serializeGame } from "@/lib/game/save";
import { sceneNarration } from "@/lib/game/scene";
import { liveTalkId } from "@/lib/game/talk";
import type { GameState } from "@/lib/game/types";

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

// --- short camp verbs ---
assert(campVerbOf("eat") === "eat", "eat is a camp verb");
assert(campVerbOf("I go to bed") === "sleep", "go to bed sleeps");
assert(campVerbOf("I dig a snow cave") == null, "cave is not a camp verb");

let s = idleAt(createGame("Improv Ward", "coat"), "high-camp");
s.inventory = { ...s.inventory, rations: 4 };
const ate = say(s, "eat");
assert(ate.inventory.rations === s.inventory.rations - 1 || ate.meters.hunger > s.meters.hunger, "eat still feeds");
assert(!looksLikeTemplate(journal(ate)), "eat copy is still camp copy, not attempt template");

// --- 1. snow cave ---
s = idleAt(createGame("Cave Ward", "coat"), "high-camp");
const caveLine = "I dig a snow cave under the deadfall, drag my blanket in, and wait the blow out.";
const cave = say(s, caveLine);
const caveJournal = journal(cave);
notTemplate(caveJournal, "snow cave");
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
assert(cave.activeEncounterId, "next beat is a scene about the cave");
const caveChoices = getChoices(cave);
assert(
  caveChoices.some((c) => /cave/i.test(c.label)),
  `next choices must be about the cave, got ${caveChoices.map((c) => c.label).join(" / ")}`,
);
const stay = caveChoices.find((c) => c.action.type === "encounterChoice" && /stay/i.test(c.label));
assert(stay, "stay in the cave is offered");
const stayed = applyAction(cave, stay!.action);
const stayedText = `${journal(stayed)}\n${sceneNarration(stayed)}`;
assert(/cave/i.test(stayedText), `next hour still about the cave: ${stayedText}`);
assert(stayed.locationId === "high-camp", "staying does not walk off");
assert(stayed.inventory.extras.includes("snow-hole") || (stayed.storyFacts ?? []).some((f) => f.kind === "shelter"), "still in/of the cave");

// --- 2. drowned doe ---
s = idleAt(createGame("Doe Ward", "coat"), "high-camp");
const beforeMeat = s.inventory.rations;
const doeLine = "I walk to Frozen Creek and cut meat from a drowned doe jammed in the ice.";
const doe = say(s, doeLine);
const doeJournal = journal(doe);
notTemplate(doeJournal, "drowned doe");
assert(/drowned doe/i.test(doeJournal), `doe must stay a doe: ${doeJournal}`);
assert(!/sign turns into an animal/i.test(doeJournal), "not hunt mad-lib");
assert(doe.locationId === "creek", `should be at Frozen Creek, got ${doe.locationId}`);
const walkOnly = say(idleAt(createGame("Walker", "coat"), "high-camp"), "walk to Frozen Creek");
assert(walkOnly.locationId === "creek", `walk lands at creek, got ${walkOnly.locationId}`);
assert(
  getChoices(walkOnly).some((c) => /frozen creek/i.test(c.label) && /walk |stay |leave /i.test(c.label)),
  `arrival next hour must be about Frozen Creek, got ${getChoices(walkOnly).map((c) => c.label).join(" / ")}`,
);
assert(
  !getChoices(walkOnly).some((c) => /keep walk to frozen creek/i.test(c.label)),
  "arriving must not offer keep-walking as if you are still on the trail",
);
assert(doe.inventory.rations > beforeMeat, `meat from the doe, rations ${beforeMeat} -> ${doe.inventory.rations}`);
assert(
  (doe.storyFacts ?? []).some((f) => /doe/i.test(f.name) && f.locationId === "creek"),
  "doe remains a fact at the creek",
);
const back = { ...doe, activeEncounterId: null, pendingRoll: null };
const still = sceneNarration(back);
assert(/doe/i.test(still) || (back.storyFacts ?? []).some((f) => /doe/i.test(f.name)), "returning hour can still name the doe");

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
assert(/french|song|fatwood/i.test(sung.log.at(-1)?.text ?? sungJournal), "new beat is about the act");
assert(
  getChoices(sung).every((c) => !cannedLabels.split(" | ").includes(c.label)) ||
    /song|gift|fatwood|french/i.test(getChoices(sung).map((c) => c.label).join(" ")),
  "next choices should not be the unused eliza buttons",
);

// --- 4. invent a person ---
s = idleAt(createGame("Absalom Ward", "coat"), "high-camp");
const meet = say(s, "I meet a trapper called Absalom Pike who owes me a kettle.");
notTemplate(journal(meet), "absalom");
assert(/Absalom Pike/i.test(journal(meet)), `must keep the name: ${journal(meet)}`);
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
assert(revived.generatedEncounters && revived.generatedEncounters.length > 0, "generated scene persists");

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
assert(
  getChoices(woodWalk).some((c) => /firewood/i.test(c.label)),
  `next choices about firewood, got ${getChoices(woodWalk).map((c) => c.label).join(" / ")}`,
);

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
const pebbleChoices = getChoices(pebble).map((c) => c.label).join(" / ");
const carvedChoices = getChoices(carved).map((c) => c.label).join(" / ");
assert(/pebble|magpie/i.test(pebbleChoices), `pebble next hour must name pebble/magpie, got ${pebbleChoices}`);
assert(/carve|name|ice/i.test(carvedChoices), `carve next hour must name the ice/name, got ${carvedChoices}`);
assert(pebbleChoices !== carvedChoices, "two off-script acts must not share the same next buttons");

console.log("improv ok", {
  cave: cave.activeEncounterId,
  doeAt: doe.locationId,
  meat: doe.inventory.rations,
  songClosed: cannedId,
  absalom: revived.generatedPeople?.map((p) => p.name),
  facts: revived.storyFacts?.map((f) => f.name),
  creekWood: woodWalk.inventory.firewood,
});
