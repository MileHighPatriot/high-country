import { interpretAttempt, matchEncounterChoice, planAttempt, shouldDispatchVerb } from "@/lib/game/attempt";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { applyAction, createGame } from "@/lib/game/engine";
import { attemptOutcome } from "@/lib/game/improv";
import type { EncounterDef, GameState } from "@/lib/game/types";
import { hydrateGame, serializeGame, parseGame } from "@/lib/game/save";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function idle(state: GameState): GameState {
  return { ...state, activeEncounterId: null, skirmish: null, pendingRoll: null, waitScene: null, improvScene: null };
}

function finishDie(state: GameState): GameState {
  let next = state;
  if (next.pendingRoll && next.pendingRoll.d20 == null) next = applyAction(next, { type: "castDie" });
  if (next.pendingRoll && next.pendingRoll.d20 != null) next = applyAction(next, { type: "finishDie" });
  return next;
}

function play(state: GameState, text: string): GameState {
  let next = applyAction(state, { type: "attempt", text });
  return finishDie(next);
}

const hunt = planAttempt("I hunt the elk along the wallow");
assert(hunt.trait === "eye", `hunt should be eye, got ${hunt.trait}`);
const talkPlan = planAttempt("ask about the pass");
assert(talkPlan.trait === "savvy", `ask should be savvy, got ${talkPlan.trait}`);

const enc: EncounterDef = {
  id: "spr-camp-drip",
  text: "Meltwater needles through the lean-to roof.",
  choices: [
    {
      id: "fix",
      label: "Re-lash the poles",
      check: { trait: "hands", dc: 11 },
      success: { text: "CANNED SUCCESS", hours: 2, meters: { energy: -8, warmth: 6 } },
      fail: { text: "CANNED FAIL", hours: 2, meters: { health: -6 } },
    },
    {
      id: "move",
      label: "Shift your bed out of the drip",
      outcome: { text: "CANNED MOVE", hours: 1, meters: { warmth: -4 } },
    },
  ],
};

const matched = matchEncounterChoice("I choose to re-lash the poles", enc);
assert(matched?.id === "fix", `typed choice should match re-lash, got ${matched?.id}`);
const other = matchEncounterChoice("I climb the snag and shout at the thaw", enc);
assert(!other || other.id !== "fix", "a different act should not steal the canned button");
assert(!matchEncounterChoice("I go to bed", enc), "sleeping should not count as shifting the drip-bed");

let s = idle(createGame("Improv", "coat"));
s.locationId = "high-camp";
s.knownLocations = Array.from(new Set(["high-camp", "creek", "timberline", ...s.knownLocations]));
s.inventory = { ...s.inventory, rations: 4, water: 3, firewood: 4, powder: 3 };
s.meters = { hunger: 80, thirst: 80, warmth: 80, energy: 80, health: 90 };

const traveled = play({ ...s, pendingRoll: null }, "go to the creek");
assert(traveled.locationId === "creek" || traveled.pendingRoll, `going to the creek should travel or roll, at ${traveled.locationId}`);
if (traveled.pendingRoll) {
  const after = finishDie(traveled);
  assert(after.locationId === "creek" || after.log.at(-1)?.text.includes("creek") || /creek|trail|miles/i.test(after.log.at(-1)?.text ?? ""), "travel attempt should name the creek or arrive");
}

const compound = interpretAttempt(
  "I walk to Frozen Creek and cut meat from a drowned doe in the ice",
  { ...s, locationId: "high-camp" },
);
assert(compound.vector === "hunt", `compound creek hunt should be hunt, got ${compound.vector}`);
assert(compound.locationId === "creek", `compound should name creek, got ${compound.locationId}`);
assert(compound.complex, "a long act should not collapse into a preset trail button");
const creekPlan = interpretAttempt("go to the creek", { ...s, locationId: "high-camp" });
assert(creekPlan.vector === "travel", `go to the creek should be travel, got ${creekPlan.vector}`);
assert(creekPlan.locationId === "creek", `should name creek, got ${creekPlan.locationId}`);
assert(creekPlan.verb?.type === "travel", "simple travel should dispatch the trail");
assert(shouldDispatchVerb(s, creekPlan), "idle simple travel should dispatch");

let drip: GameState = {
  ...s,
  activeEncounterId: "spr-camp-drip",
  pendingRoll: null,
  skirmish: null,
};
const climbed = play(drip, "I climb the snag and shout at the thaw until the mountain answers");
assert(climbed.activeEncounterId !== "spr-camp-drip" || climbed.improvScene, "off-script typing should leave the canned beat");
const climbText = climbed.log.map((e) => e.text).join(" ");
assert(/climb the snag|shout at the thaw/i.test(climbText), `off-script act should echo the player's words, got ${climbText.slice(-200)}`);
assert(!/reset the frame|smaller dry island|CANNED/i.test(climbText), "typed act must not dump the button's canned copy");

const framed = interpretAttempt("I choose to re-lash the poles", drip, enc);
assert(framed.choiceId === "fix", "re-lash should attach the presented option as a frame");
const custom = attemptOutcome(drip, framed, true);
assert(/re-lash the poles/i.test(custom.text), `framed act should speak the player's words, got ${custom.text}`);
assert(!custom.text.includes("CANNED SUCCESS"), "framed success must not use the button's canned sentence");
assert(custom.meters?.energy != null || custom.hours === 2, "framed act should keep the option's mechanical cost");

const a = play({ ...s, rngSeed: 1 }, "I build a snow cave out of the cornice and wait for the blizzard to spend itself");
const b = play({ ...s, rngSeed: 1 }, "I teach the empty air a French song and dare the timber to sing it back");
const aText = a.log.map((e) => e.text).join(" ");
const bText = b.log.map((e) => e.text).join(" ");
assert(aText !== bText, "two different acts should write two different hours");
assert(/snow cave|blizzard/i.test(aText), `snow cave act should stay about the cave, got ${aText.slice(-240)}`);
assert(/French song|timber/i.test(bText), `song act should stay about the song, got ${bText.slice(-240)}`);

const beat = play({ ...s, rngSeed: 99 }, "I follow the blood trail into the krummholz and whistle for whatever made it");
assert(beat.story && beat.story.length > 0, "the mountain should remember a freeform act");
assert(beat.world?.rumors.length, "a rumor should get loose");

const raw = serializeGame(beat);
const parsed = parseGame(raw);
assert(parsed, "improv save should parse");
const hydrated = hydrateGame(parsed!);
assert((hydrated.story ?? []).length > 0, "story survives a save");

let talk = idle(createGame("Talk Improv", "coat"));
talk.locationId = "abandoned-cabin";
talk.hour = 10;
talk.presentCharacterId = "eliza-ward";
talk.seenDialogueIds = (CHARACTER_BY_ID["eliza-ward"]?.nodes ?? []).map((n) => n.id);
talk = applyAction(talk, { type: "talk" });
assert(talk.activeEncounterId, "talk should open a beat");
const said = play(talk, "I tell her the pass is a coffin and I will cut her wood until my hands shake");
const saidText = said.log.map((e) => e.text).join(" ");
assert(/pass is a coffin|cut her wood|hands shake/i.test(saidText), `talk typing should follow the spoken choice, got ${saidText.slice(-240)}`);

console.log("improv ok", {
  hunt: hunt.trait,
  travel: creekPlan.locationId,
  story: beat.story?.at(-1)?.vector,
  rumors: beat.world?.rumors.length,
  climbLeft: climbed.activeEncounterId,
});
