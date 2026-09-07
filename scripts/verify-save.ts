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

const old = JSON.parse(serializeGame(live)) as ReturnType<typeof createGame>;
delete old.world;
const revived = hydrateGame(old);
assert(revived.world && Object.keys(revived.world.people).length >= 20, "v1 save without world seeds on load");

assert(campaignLine(live).includes("Ward"), campaignLine(live));
assert(exportFilename(live).startsWith("high-country-ward-day-"), exportFilename(live));
assert(parseGame("not json") == null, "bad json");
assert(parseGame(JSON.stringify({ name: "Ward", locationId: "high-camp" })) == null, "incomplete json");

const padded = {
  ...live,
  log: Array.from({ length: 20 }, (_, i) => ({
    id: `beat-${i}`,
    text: `Hour ${i}`,
    daysSurvived: 1,
    hour: i,
    locationId: live.locationId,
  })),
};
const slim = parseGame(serializeGame(padded, 8));
assert(slim, "slim serialize parses");
assert(slim.log.length <= 8, `slim log should be short, got ${slim.log.length}`);
assert(slim.log[0]?.id === "beat-0", "slim keep still holds the opening line");
assert(JSON.parse(serializeGame(live)).waitScene == null, "default serialize drops wait");

const missingLog = JSON.parse(serializeGame(live)) as ReturnType<typeof createGame>;
delete (missingLog as { log?: unknown }).log;
const revivedLog = hydrateGame(missingLog as ReturnType<typeof createGame>);
assert(Array.isArray(revivedLog.log), "missing log hydrates to an array");

console.log("save ok", {
  line: campaignLine(live),
  file: exportFilename(live),
  people: Object.keys(live.world!.people).length,
});
