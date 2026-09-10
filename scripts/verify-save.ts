import { createGame } from "@/lib/game/engine";
import {
  campaignLine,
  exportFilename,
  hydrateGame,
  isLiveSave,
  parseGame,
  serializeGame,
} from "@/lib/game/save";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const live = createGame("Ward", "coat");
assert(live.world && Object.keys(live.world.people).length >= 20, "new game seeds the range");
assert(isLiveSave(live), "fresh game is a live save");
assert(!isLiveSave({ ...live, dead: { cause: "exposure", detail: "cold", daysSurvived: 2, season: "winter" } }), "dead run is not live");
assert(!isLiveSave({ name: "x" }), "junk is not a save");

const raw = serializeGame({ ...live, waitScene: { hours: 4, fromHour: 8, fireLit: true, fireDies: false, arrivalId: null } });
const parsed = parseGame(raw);
assert(parsed, "roundtrip parse");
assert(parsed.waitScene == null, "wait scene does not persist");
assert(parsed.name === "Ward", "name survives");
assert(parsed.world && parsed.world.people["eliza-ward"], "eliza is on the range after parse");

const withFacts = serializeGame({
  ...live,
  storyFacts: [
    {
      id: "animal-drowned-doe-creek",
      kind: "animal",
      name: "drowned doe",
      nouns: ["drowned doe"],
      locationId: "creek",
      said: "cut meat",
      note: "jammed in the ice",
      status: "present",
      dayOfYear: live.dayOfYear,
      hour: live.hour,
    },
  ],
  generatedPeople: [{ id: "gm-absalom-pike", name: "Absalom Pike", blurb: "owes a kettle", fallback: "He waits.", home: ["high-camp"] }],
});
const factsLoaded = parseGame(withFacts);
assert(factsLoaded?.storyFacts?.some((f) => f.name === "drowned doe"), "story facts survive save");
assert(factsLoaded?.generatedPeople?.some((p) => p.id === "gm-absalom-pike"), "generated people survive save");

const old = JSON.parse(serializeGame(live)) as ReturnType<typeof createGame>;
delete old.world;
const revived = hydrateGame(old);
assert(revived.world && Object.keys(revived.world.people).length >= 20, "v1 save without world seeds on load");

assert(campaignLine(live).includes("Ward"), campaignLine(live));
assert(exportFilename(live).startsWith("high-country-ward-day-"), exportFilename(live));
assert(parseGame("not json") == null, "bad json");
assert(parseGame(JSON.stringify({ name: "Ward", locationId: "high-camp" })) == null, "incomplete json");

console.log("save ok", {
  line: campaignLine(live),
  file: exportFilename(live),
  people: Object.keys(live.world!.people).length,
});
