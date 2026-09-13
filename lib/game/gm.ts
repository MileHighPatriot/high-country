import { characterOf, locationOf, placeTitle } from "@/lib/game/atlas";
import { atOwnCamp } from "@/lib/game/camp";
import { CHARACTERS } from "@/lib/game/content/characters";
import { LOCATIONS } from "@/lib/game/content/locations";
import { canRaise, WORKS } from "@/lib/game/homestead";
import { trailHours } from "@/lib/game/readout";
import type {
  CampPiece,
  CharacterId,
  EncounterChoice,
  EncounterDef,
  GameState,
  GeneratedPerson,
  GeneratedPlace,
  HomesteadWorkId,
  LocationId,
  Meters,
  Outcome,
  StoryFact,
  StoryFactKind,
  Trait,
} from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

export type CampVerb = "eat" | "drink" | "sleep" | "rest";

export interface GmAct {
  risky: boolean;
  trait: Trait;
  dc: number;
  label: string;
  hours: number;
  relocate?: LocationId;
  meters: Partial<Meters>;
  inventory?: Outcome["inventory"];
  extraAdd?: string;
  extraRemove?: string;
  standing?: { id: CharacterId; delta: number };
  facts: StoryFact[];
  people: GeneratedPerson[];
  places: GeneratedPlace[];
  rumors: string[];
  presentCharacterId?: CharacterId | null;
  narration: string;
  encounter: EncounterDef;
  focusFactIds: string[];
  /** Light a real fire after the die — not a Keep/Stay follow-up. */
  lightFire?: boolean;
  campfireHours?: number;
  tendHours?: number;
  raiseWork?: HomesteadWorkId;
  buildPiece?: CampPiece;
}

const STOP = new Set(
  "a an the and or to of in on at for from with my your i me we you it this that then now here there out up down off not but if as is am are was be do did go going went come came try trying just like about into over under after before than so very much own still also will would can could should shall may might must have has had him her his they them their who whom whose what when where why how into onto upon across along among around behind below beside between beyond during except inside outside toward until without i'll i'm i've don't can't won't let's",
);

const UTE_IDS = new Set([
  "two-crows",
  "nawat",
  "gray-elk",
  "little-star",
  "otter-that-waits",
  "white-shell",
  "frost-on-antler",
]);

const PLACE_ALIAS: Array<{ id: LocationId; names: string[] }> = LOCATIONS.map((loc) => ({
  id: loc.id,
  names: [
    loc.name.toLowerCase(),
    loc.id.replace(/-/g, " "),
    ...shortPlaceNames(loc.id, loc.name),
  ],
}));

function shortPlaceNames(id: LocationId, name: string): string[] {
  const extra: string[] = [];
  if (id === "creek") extra.push("frozen creek", "the creek", "creek");
  if (id === "high-camp") extra.push("high camp", "the bench", "camp");
  if (id === "ute-camp") extra.push("ute camp", "the ute camp");
  if (id === "abandoned-cabin") extra.push("the cabin", "cabin", "eliza's cabin");
  if (id === "lightning-pine") extra.push("the snag", "split snag", "lightning pine");
  if (id === "cache-deadfall") extra.push("the deadfall", "deadfall", "cache");
  if (id === "south-pass") extra.push("the pass", "south pass");
  extra.push(name.toLowerCase().replace(/^the /, ""));
  return extra;
}

function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(s: string) {
  const t = fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return t.slice(0, 48) || "thing";
}

function titleCase(s: string) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function sentence(s: string) {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const body = t.replace(/\.$/, "");
  return body.charAt(0).toUpperCase() + body.slice(1) + ".";
}

function contentTokens(text: string): string[] {
  return fold(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Player's act as a title. Never "the act". */
export function actTitle(raw: string): string {
  let t = raw.trim().replace(/\s+/g, " ").replace(/[.?!]+$/, "");
  t = t.replace(/^(i('ll| will| am going to| want to)?|let me|try to|i try to)\s+/i, "");
  if (!t) t = raw.trim();
  if (t.length > 56) t = t.slice(0, 56).replace(/\s+\S*$/, "");
  return t || "what you did";
}

export function campVerbOf(text: string): CampVerb | null {
  const line = fold(text).replace(/\.$/, "");
  if (/^(i )?(eat|chew a ration|take a bite)$/.test(line)) return "eat";
  if (/^(i )?(drink|drink water|fill the tin and drink)$/.test(line)) return "drink";
  if (/^(i )?(sleep|go to sleep|go to bed|lie down)$/.test(line)) return "sleep";
  if (/^(i )?(rest|watch a while|sit a while|rest the legs)$/.test(line)) return "rest";
  return null;
}

/** Conservative: same choice, not shared small words. */
export function matchPresentedOption(text: string, choices: EncounterChoice[]): EncounterChoice | null {
  const player = contentTokens(text);
  if (player.length < 2) return null;
  let best: { choice: EncounterChoice; score: number } | null = null;
  for (const choice of choices) {
    const label = contentTokens(choice.label);
    if (label.length < 2) continue;
    const overlap = player.filter((w) => label.includes(w));
    const distinctive = overlap.filter((w) => w.length > 3);
    if (distinctive.length < 2) continue;
    const score = distinctive.length / Math.max(label.length, player.length);
    if (score < 0.45) continue;
    if (!best || score > best.score) best = { choice, score };
  }
  return best?.choice ?? null;
}

export function playerProse(said: string, success: boolean | null): string {
  const act = sentence(said);
  if (success === false) return `${act} It comes apart in the hands.`;
  if (success === true) return `${act} The hour takes it as done.`;
  return act;
}

interface Slots {
  raw: string;
  travelTo: LocationId | null;
  travelName: string | null;
  inventTrail: boolean;
  unknownPlace: string | null;
  people: Array<{ id?: CharacterId; name: string; known: boolean }>;
  objects: string[];
  stunts: string[];
  song: string | null;
  gift: string | null;
  lie: boolean;
  accuse: boolean;
}

function findPlace(state: GameState, line: string): { id: LocationId; name: string } | null {
  const generated = state.generatedPlaces ?? [];
  const catalog = [
    ...generated.map((p) => ({ id: p.id, names: [p.name.toLowerCase(), p.id.replace(/-/g, " ")] })),
    ...PLACE_ALIAS,
  ];
  let hit: { id: LocationId; name: string; len: number } | null = null;
  for (const row of catalog) {
    for (const n of row.names) {
      if (n.length < 3) continue;
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(line) && (!hit || n.length > hit.len)) {
        const pretty = locationOf(state, row.id)?.name ?? titleCase(n);
        hit = { id: row.id, name: pretty, len: n.length };
      }
    }
  }
  return hit ? { id: hit.id, name: hit.name } : null;
}

function findPeople(state: GameState, raw: string, line: string): Slots["people"] {
  const people: Slots["people"] = [];
  const seen = new Set<string>();
  const add = (row: Slots["people"][number]) => {
    const key = row.id ?? fold(row.name);
    if (seen.has(key)) return;
    seen.add(key);
    people.push(row);
  };

  const called = raw.match(/\b(?:called|named)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/);
  if (called?.[1]) add({ name: called[1].replace(/[’']/g, "'"), known: false });

  for (const person of CHARACTERS) {
    const names = [person.name, ...person.name.split(" ").filter((p) => p.length > 3)];
    for (const n of names) {
      const re = new RegExp(`\\b${fold(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(line)) {
        add({ id: person.id, name: person.name, known: true });
        break;
      }
    }
  }
  for (const person of state.generatedPeople ?? []) {
    if (line.includes(fold(person.name))) add({ id: person.id, name: person.name, known: true });
  }

  if (/\ba ute\b|\bthe ute\b|\butes\b/.test(line)) {
    const here = peopleAt(state).find((p) => UTE_IDS.has(p.id));
    if (here) {
      const named = characterOf(state, here.id);
      add({ id: here.id, name: named?.name ?? here.id, known: true });
    } else if (!people.some((p) => UTE_IDS.has(p.id ?? ""))) {
      add({ name: "a Ute", known: false });
    }
  }

  const caps = raw.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g) ?? [];
  const placeNames = new Set(LOCATIONS.flatMap((l) => [l.name, ...l.name.split(" ")]));
  for (const cap of caps) {
    if (placeNames.has(cap)) continue;
    if (/^(I|The|A|An|My|Frozen|High|South|Ute|Mexican|Arapaho)$/.test(cap.split(" ")[0] ?? "")) continue;
    if (CHARACTERS.some((c) => c.name === cap)) continue;
    if (cap.split(" ").length >= 2) add({ name: cap, known: false });
  }
  return people;
}

function extractObjects(line: string, raw: string): string[] {
  const found: string[] = [];
  const compounds = [
    "snow cave",
    "drowned doe",
    "french song",
    "side trail",
    "tin whistle",
    "brass compass",
    "deadfall",
    "blanket",
    "kettle",
    "fatwood",
    "snag",
    "doe",
    "firewood",
    "kindling",
    "driftwood",
    "deadwood",
    "magpie",
    "pebble",
  ];
  for (const c of compounds) {
    if (line.includes(c) && !found.includes(c)) found.push(c);
  }
  const seek = /\b(?:find|gather|get|collect|look for|search for|pick up|break|chop|fetch|hunt for|grab)\s+(?:some |any |more |the |a |an )?([a-z]+(?:\s+[a-z]+){0,3})/g;
  let m: RegExpExecArray | null;
  while ((m = seek.exec(line))) {
    const phrase = (m[1] ?? "").trim();
    if (!phrase || STOP.has(phrase.split(" ")[0] ?? "")) continue;
    if (!found.some((f) => f.includes(phrase) || phrase.includes(f))) found.push(phrase);
  }
  const re = /\b(?:a|an|the|my|his|her|this|that|some|any|more)\s+([a-z]+(?:\s+[a-z]+){0,3})/g;
  while ((m = re.exec(line))) {
    const phrase = (m[1] ?? "").trim();
    if (!phrase || STOP.has(phrase.split(" ")[0] ?? "")) continue;
    if (phrase.length < 3) continue;
    if (found.some((f) => f.includes(phrase) || phrase.includes(f))) continue;
    if (PLACE_ALIAS.some((p) => p.names.includes(phrase))) continue;
    found.push(phrase);
  }
  const song = raw.match(/\b(french song|chanson|[a-z]+ song)\b/i);
  if (song && !found.some((f) => f.includes("song"))) found.push(fold(song[1] ?? "song"));
  return found.slice(0, 8);
}

function extractStunts(line: string): string[] {
  const stunts: string[] = [];
  const verbs: Array<[RegExp, string]> = [
    [/\bdig|\bsnow cave/, "dig"],
    [/\bdrag|\bpull/, "drag"],
    [/\bwait the blow|\bwait it out|\bwait out/, "wait-blow"],
    [/\bcut meat|\bbutcher|\bskin/, "cut"],
    [/\bcarve/, "carve"],
    [/\bwalk to|\bgo to|\bhead to|\bmake for/, "walk"],
    [/\bwalk around|\blook around|\bsearch|\bfind|\bgather|\bfetch|\bcollect/, "search"],
    [/\bsing|\bsong|\bchanson/, "sing"],
    [/\bclimb/, "climb"],
    [/\baccus/, "accuse"],
    [/\blie to|\blying to|\btell a lie|\bI lie\b/, "lie"],
    [/\bgive|\bgift/, "gift"],
    [/\bmeet|\bfind a man|\bfind a woman|\ba trapper/, "meet"],
    [/\binvent|\bside trail|\boff the (map|trail)/, "invent-trail"],
    [/\bthrow|\btoss/, "throw"],
    [/\bmake a fire|\bbuild a fire|\blight a fire|\bstart a fire|\bget a coal/, "fire"],
    [/\btend (the )?fire|\bfeed the (fire|coals)/, "tend"],
    [/\braise |\bbuild a (lean|platform|wall|roof|shed)/, "raise"],
  ];
  for (const [re, name] of verbs) {
    if (re.test(line) && !stunts.includes(name)) stunts.push(name);
  }
  return stunts;
}

function isWoodAsk(line: string) {
  return /\bfirewood\b|\bkindling\b|\bdriftwood\b|\bdeadwood\b|\bdeadwood\b|\bdead (limbs|wood|branches)\b|\b(some |any |more )?(wood|timber)\b/.test(
    line,
  );
}

function isWaterAsk(line: string) {
  return /\b(fill|melt).{0,20}(water|ice|tin|canteen)|\bgather water\b|\bget water\b|\bdrink from the creek\b/.test(line);
}

function isFireAsk(line: string) {
  return (
    /\b(make|build|start|light|kindle)\b.{0,28}\b(a |the )?(fire|coal)\b/.test(line) ||
    /\bget a coal going\b/.test(line) ||
    /\b(a |the )?fire going\b/.test(line)
  );
}

function isTendAsk(line: string) {
  return /\btend (the )?fire\b|\bfeed the (fire|coals|flames)\b|\bbank the coals\b|\bsit by the fire\b/.test(
    line,
  );
}

function raiseTarget(
  line: string,
): { kind: "raise"; work: HomesteadWorkId } | { kind: "build"; piece: CampPiece } | null {
  if (isFireAsk(line) || isTendAsk(line)) return null;
  if (/\bsnow cave\b/.test(line) || (/\bdig\b/.test(line) && !/\bouthouse\b/.test(line))) return null;
  const wants =
    /\braise\b|\bbuild\b|\blay\b|\bhang\b|\bframe\b|\bput up\b|\bset a\b/.test(line) ||
    /\blean-?to\b/.test(line) ||
    /\bplatform\b/.test(line);
  if (!wants) return null;
  if (/\blean-?to\b/.test(line)) return { kind: "build", piece: "leanTo" };
  if (/\bfire ring\b|\bring of stone\b/.test(line)) return { kind: "build", piece: "fireRing" };
  if (/\bwoodpile\b|\bwood pile\b/.test(line)) return { kind: "build", piece: "woodpile" };
  if (/\bcache pit\b/.test(line)) return { kind: "build", piece: "cachePit" };
  if (/\bdrying rack\b/.test(line)) return { kind: "build", piece: "dryingRack" };
  const named: Array<[RegExp, HomesteadWorkId]> = [
    [/\bplatform\b/, "platform"],
    [/\bwind wall\b/, "wall-wind"],
    [/\bcreek wall\b/, "wall-creek"],
    [/\btimber wall\b/, "wall-timber"],
    [/\bpass wall\b/, "wall-pass"],
    [/\broof\b/, "roof"],
    [/\bdoor\b/, "door"],
    [/\bstove\b/, "stove"],
    [/\bbunk\b/, "bunk"],
    [/\bloft\b/, "loft"],
    [/\bshelves\b/, "shelves"],
    [/\btable\b/, "table"],
    [/\blatch\b/, "latch"],
    [/\bfloor\b/, "floor"],
    [/\bshutters\b/, "shutters"],
    [/\bwindow skin\b/, "window-skin"],
    [/\bpeg rail\b/, "peg-rail"],
    [/\bwash basin\b/, "wash-basin"],
    [/\blamp niche\b/, "lamp-niche"],
    [/\bwood shed\b/, "wood-shed"],
    [/\bstorage shed\b/, "storage-shed"],
    [/\bsmokehouse\b/, "smokehouse"],
    [/\bouthouse\b/, "outhouse"],
    [/\bgarden\b/, "garden"],
    [/\brain barrel\b/, "rain-barrel"],
    [/\bspring box\b/, "spring-box"],
    [/\broot cellar\b/, "root-cellar"],
    [/\bhide stretchers\b/, "hide-stretchers"],
    [/\bmeat pole\b/, "meat-pole"],
    [/\bpalisade\b/, "palisade"],
    [/\bwash trough\b/, "wash-trough"],
    [/\blookout\b/, "lookout"],
    [/\bfish rack\b/, "fish-rack"],
    [/\bice cellar\b/, "ice-cellar"],
  ];
  for (const [re, id] of named) {
    if (re.test(line)) return { kind: "raise", work: id };
  }
  return null;
}

function parseSlots(state: GameState, text: string): Slots {
  const raw = text.trim().replace(/\s+/g, " ");
  const line = fold(raw);
  const place = findPlace(state, line);
  const walking = /\bwalk to\b|\bgo to\b|\bhead to\b|\bmake for\b/.test(line);
  const inventTrail = /\bside trail\b|\boff the (map|trail)\b|\ba trail that is not\b|\binvent a .*trail/.test(line);
  let unknownPlace: string | null = null;
  if (walking && !place) {
    const named = raw.match(/\b(?:walk|go|head|make)(?:\s+to|\s+for)\s+(?:the\s+)?([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/);
    if (named?.[1] && !/^(Bed|Sleep|Eat|Drink)$/i.test(named[1])) unknownPlace = named[1];
  }
  const giftMatch = line.match(/\bgift of ([a-z- ]+?)(?:\.|$| and)/) || line.match(/\bgive (?:her|him|them) (?:a |the )?([a-z- ]+?)(?:\.|$| and)/);
  return {
    raw,
    travelTo: walking && place && place.id !== state.locationId ? place.id : null,
    travelName: place && (walking || place.id !== state.locationId) ? place.name : place?.name ?? null,
    inventTrail,
    unknownPlace,
    people: findPeople(state, raw, line),
    objects: extractObjects(line, raw),
    stunts: extractStunts(line),
    song: /\bsing|\bsong|\bchanson/.test(line) ? objectsSong(line) : null,
    gift: giftMatch?.[1]?.trim() ?? null,
    lie: /\blie to\b|\blying to\b|\btell a lie\b/.test(line),
    accuse: /\baccus/.test(line),
  };
}

function objectsSong(line: string) {
  if (line.includes("french")) return "French song";
  const m = line.match(/\b([a-z]+ song)\b/);
  return m ? titleCase(m[1]!) : "a song";
}

function factId(kind: StoryFactKind, name: string, locationId: LocationId) {
  return `${kind}-${slug(name)}-${locationId}`;
}

function personId(name: string) {
  if (fold(name) === "a ute") return "gm-ute";
  return `gm-${slug(name)}`;
}

function upsertFact(list: StoryFact[], fact: StoryFact) {
  const i = list.findIndex((f) => f.id === fact.id);
  if (i >= 0) list[i] = { ...list[i]!, ...fact, nouns: Array.from(new Set([...list[i]!.nouns, ...fact.nouns])) };
  else list.push(fact);
}

function dieFor(slots: Slots, state: GameState): { risky: boolean; trait: Trait; dc: number; label: string } {
  const obj = slots.objects[0];
  const line = fold(slots.raw);
  if (isFireAsk(line)) {
    return { risky: true, trait: "hands", dc: state.weather === "blizzard" ? 13 : 11, label: "Make a fire" };
  }
  if (isTendAsk(line)) {
    return { risky: true, trait: "hands", dc: 10, label: "Tend the fire" };
  }
  const raise = raiseTarget(line);
  if (raise?.kind === "raise") {
    const work = WORKS.find((w) => w.id === raise.work);
    return { risky: true, trait: "hands", dc: 12, label: work?.label ?? "Raise" };
  }
  if (raise?.kind === "build") {
    return {
      risky: true,
      trait: "hands",
      dc: 12,
      label: raise.piece === "leanTo" ? "Raise a lean-to" : "Build",
    };
  }
  if (slots.stunts.includes("dig") || slots.objects.includes("snow cave")) {
    return {
      risky: true,
      trait: state.weather === "blizzard" ? "grit" : "hands",
      dc: state.weather === "blizzard" ? 13 : 12,
      label: obj ? `Dig the ${obj}` : "Dig a cave",
    };
  }
  if (slots.objects.includes("drowned doe") || /\bcut meat|\bbutcher|\bskin\b/.test(line)) {
    return { risky: true, trait: "hands", dc: 13, label: "Cut meat from the ice" };
  }
  if (slots.stunts.includes("climb")) {
    return { risky: true, trait: "hands", dc: 13, label: obj ? `Climb the ${obj}` : "Climb" };
  }
  if (slots.lie || slots.stunts.includes("lie")) {
    return { risky: true, trait: "savvy", dc: 12, label: "Lie" };
  }
  if (slots.accuse || slots.stunts.includes("accuse")) {
    return { risky: true, trait: "savvy", dc: 12, label: "Accuse" };
  }
  if (slots.inventTrail || slots.unknownPlace) {
    return { risky: true, trait: "savvy", dc: 12, label: "Take a trail the map does not have" };
  }
  if (slots.stunts.includes("sing") || slots.song) {
    return { risky: true, trait: "savvy", dc: 11, label: slots.song ?? "Sing" };
  }
  if (/\bscout|track|read sign|read the ground/.test(line)) {
    return { risky: true, trait: "savvy", dc: 12, label: "Read the ground" };
  }
  if (slots.stunts.includes("walk") && slots.travelTo) {
    return { risky: true, trait: "grit", dc: state.weather === "blizzard" ? 13 : 11, label: `Walk to ${slots.travelName}` };
  }
  const title = actTitle(slots.raw);
  if (isWoodAsk(line)) {
    return { risky: true, trait: "hands", dc: 12, label: title };
  }
  return { risky: true, trait: "savvy", dc: 12, label: title };
}

function extraFromGift(gift: string | null, state: GameState): string | null {
  if (!gift) return null;
  const g = fold(gift);
  const extras = state.inventory.extras;
  const hit = extras.find((e) => fold(e.replace(/-/g, " ")) === g || g.includes(fold(e.replace(/-/g, " "))));
  if (hit) return hit;
  if (g.includes("fatwood") && extras.includes("fatwood")) return "fatwood";
  if (g.includes("pelt") && state.inventory.pelts > 0) return "pelt";
  return null;
}

function walkTarget(state: GameState, slots: Slots): { to: LocationId; hours: number; arrived: boolean; trailName: string } | null {
  if (slots.unknownPlace || slots.inventTrail) return null;
  if (!slots.travelTo) return null;
  const here = locationOf(state, state.locationId);
  const edge = here?.connections.find((c) => c.to === slots.travelTo);
  if (edge) {
    return { to: edge.to, hours: trailHours(state, edge.hours), arrived: true, trailName: edge.trailName };
  }
  return {
    to: slots.travelTo,
    hours: trailHours(state, 3),
    arrived: true,
    trailName: `a way toward ${slots.travelName ?? "that ground"}`,
  };
}

function makePerson(state: GameState, name: string, loc: LocationId): GeneratedPerson {
  const id = personId(name);
  const existing = state.generatedPeople?.find((p) => p.id === id);
  if (existing) return existing;
  const pretty = name === "a Ute" ? "A Ute" : name;
  return {
    id,
    name: pretty,
    blurb: `${pretty} is a fact of this run, not of the old book.`,
    fallback: `${pretty} looks at you and waits to see if the last hour still counts.`,
    home: [loc],
  };
}

function makePlace(state: GameState, name: string): GeneratedPlace {
  const id = `place-${slug(name)}`;
  const existing = state.generatedPlaces?.find((p) => p.id === id);
  if (existing) return existing;
  return {
    id,
    name,
    blurb: `${name} is ground you named. The book did not.`,
    parentId: state.locationId,
    hours: 2,
    trailName: `a side trail toward ${name}`,
    tags: [],
  };
}

/** Stored for save/polish. Never opened as a Keep / Stay / Leave maze. */
function residualEncounter(facts: StoryFact[], narration: string): EncounterDef {
  const lead = facts[0];
  return {
    id: `gm-${lead?.id ?? "act"}`,
    repeatable: true,
    text: narration,
    choices: [],
  };
}

function narrate(state: GameState, slots: Slots, locName: string, success: boolean, extras: string[]): string {
  const bits: string[] = [];
  const saidNouns = [...slots.objects, ...slots.people.map((p) => p.name), slots.travelName, slots.song, slots.unknownPlace]
    .filter((n): n is string => Boolean(n))
    .filter((n) => fold(slots.raw).includes(fold(n)));

  if (slots.travelName && slots.travelTo) {
    bits.push(`You walk toward ${slots.travelName}.`);
    bits.push(`The ground is ${locName} now.`);
    if (!success) bits.push("The trail takes more out of you than it should.");
  } else if (slots.unknownPlace) {
    bits.push(`You take a side trail toward ${slots.unknownPlace}. The map did not have it. It has it now.`);
  } else if (slots.inventTrail) {
    bits.push(`You take a side trail that is not on the map. ${locName} is behind you.`);
  }

  if (slots.objects.includes("snow cave") || slots.stunts.includes("dig")) {
    const cave = slots.objects.find((o) => o.includes("cave")) ?? "snow cave";
    const under = slots.objects.includes("deadfall") || fold(slots.raw).includes("deadfall") ? " under the deadfall" : "";
    bits.push(`You dig a ${cave}${under} at ${locName}.`);
    if (slots.objects.includes("blanket") || fold(slots.raw).includes("blanket")) {
      bits.push("You drag your blanket in.");
    }
    if (slots.stunts.includes("wait-blow") || fold(slots.raw).includes("blow")) {
      bits.push("The blow works the ridge. Inside the cave the wind dies. You wait it out.");
    } else {
      bits.push("The mouth is a dark slot. Weather hits it and dies.");
    }
    if (!success) bits.push("The roof sags. It is still a cave.");
  }

  if (slots.objects.includes("drowned doe") || (slots.stunts.includes("cut") && fold(slots.raw).includes("doe"))) {
    bits.push(`A drowned doe is jammed in the ice at ${locName}.`);
    bits.push(success ? "You cut meat from her. The work is cold and honest." : "You cut meat from her. The ice takes a tax. You keep less.");
  }

  if (slots.song || slots.stunts.includes("sing")) {
    const song = slots.song ?? "a song";
    const who = slots.people[0]?.name ?? (state.presentCharacterId ? characterOf(state, state.presentCharacterId)?.name : null);
    bits.push(who ? `You sing the ${song} where ${who} can hear it.` : `You sing the ${song}. The country does not clap.`);
  }

  if (slots.gift) {
    const who = slots.people[0]?.name ?? (state.presentCharacterId ? characterOf(state, state.presentCharacterId)?.name : "the one in front of you");
    bits.push(`You give ${who} ${slots.gift}.`);
  }

  if (slots.stunts.includes("climb")) {
    const snag = slots.objects.find((o) => o.includes("snag") || o.includes("pine") || o.includes("tree")) ?? "snag";
    bits.push(`You climb the ${snag}. Bark comes off in the hands. The next ridge is a fact.`);
    if (!success) bits.push("You come down harder than you meant.");
  }

  if (slots.lie) {
    const who = slots.people[0]?.name ?? "them";
    bits.push(`You lie to ${who}. The words are now a thing that happened.`);
  }

  if (slots.accuse) {
    const who = slots.people[0]?.name ?? "them";
    bits.push(`You accuse ${who}. The words sit between you like a knife left on a table.`);
  }

  for (const person of slots.people) {
    if (person.known) continue;
    if (bits.some((b) => b.includes(person.name))) continue;
    const kettle = slots.objects.find((o) => o.includes("kettle"));
    bits.push(
      kettle
        ? `You meet ${person.name}, who owes you a ${kettle}. That is now true on this ground.`
        : `You meet ${person.name}. They are here. The book did not send them.`,
    );
  }

  if (isFireAsk(fold(slots.raw))) {
    bits.push(
      success
        ? `You make a fire at ${locName}. Punk, breath, a coal. Heat finds the bones.`
        : `You try to make a fire at ${locName}. The spark dies. The hour is colder for the trying.`,
    );
  } else if (isTendAsk(fold(slots.raw))) {
    bits.push(
      success
        ? "You tend the fire. Warmth is a small country you keep."
        : "The fire thinks of dying. You do not quite talk it out of it.",
    );
  }

  const raise = raiseTarget(fold(slots.raw));
  if (raise?.kind === "raise") {
    const work = WORKS.find((w) => w.id === raise.work);
    const name = work?.label.toLowerCase() ?? "the work";
    bits.push(success ? `You raise ${name} at ${locName}.` : `You try to raise ${name}. It does not stand.`);
  } else if (raise?.kind === "build") {
    const name = raise.piece === "leanTo" ? "a lean-to" : "the work";
    bits.push(success ? `You raise ${name} at ${locName}.` : `You try to raise ${name}. It does not stand.`);
  }

  if (isWoodAsk(fold(slots.raw)) && !isFireAsk(fold(slots.raw))) {
    bits.push(`You walk ${locName} for firewood.`);
    bits.push(
      success
        ? "Willow, driftwood, a dead limb that will take a spark. The pack is heavier."
        : "The bank is stingy. You still come away with something that will burn.",
    );
  }

  if (bits.length === 0) {
    bits.push(sentence(slots.raw));
    const obj = slots.objects[0];
    const other = slots.objects[1];
    if (obj && other) {
      bits.push(`${titleCase(obj)} and ${other} are now facts at ${locName}.`);
    } else if (obj) {
      bits.push(`${titleCase(obj)} is now a fact at ${locName}.`);
    } else {
      bits.push(`${actTitle(slots.raw)} is now a fact at ${locName}.`);
    }
  }

  for (const n of saidNouns) {
    const joined = bits.join(" ");
    if (!fold(joined).includes(fold(n))) bits.push(`${titleCase(n)} remains in the hour.`);
  }

  if (extras.length) bits.push(extras.join(" "));
  return bits.join(" ").replace(/\s+/g, " ").trim();
}

export function interpretAct(state: GameState, text: string, success: boolean): GmAct {
  const slots = parseSlots(state, text);
  const die = dieFor(slots, state);
  const facts: StoryFact[] = [];
  const people: GeneratedPerson[] = [];
  const places: GeneratedPlace[] = [];
  const rumors: string[] = [];
  const extras: string[] = [];
  let hours = 2;
  let relocate: LocationId | undefined;
  const meters: Partial<Meters> = { energy: success ? -8 : -12 };
  let inventory: Outcome["inventory"];
  let extraAdd: string | undefined;
  let extraRemove: string | undefined;
  let standing: GmAct["standing"];
  let present = state.presentCharacterId;
  let locId = state.locationId;
  let lightFire = false;
  let campfireHours: number | undefined;
  let tendHours: number | undefined;
  let raiseWork: HomesteadWorkId | undefined;
  let buildPiece: CampPiece | undefined;

  const walk = walkTarget(state, slots);
  if (walk) {
    hours = walk.hours + (slots.stunts.includes("cut") || slots.objects.includes("drowned doe") ? 2 : 1);
    relocate = walk.to;
    locId = walk.to;
    extras.push(`You take ${walk.trailName}.`);
  } else if (slots.unknownPlace || slots.inventTrail) {
    const name = slots.unknownPlace ?? "the side trail";
    const place = makePlace(state, name);
    places.push(place);
    hours = trailHours(state, place.hours);
    relocate = place.id;
    locId = place.id;
    upsertFact(facts, {
      id: factId("place", place.name, place.id),
      kind: "place",
      name: place.name,
      nouns: [place.name, "side trail"],
      locationId: place.id,
      said: slots.raw,
      note: `${place.name} is a side trail off ${placeTitle(state, state.locationId)}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
    upsertFact(facts, {
      id: factId("trail", place.trailName, state.locationId),
      kind: "trail",
      name: place.trailName,
      nouns: ["side trail", place.name],
      locationId: state.locationId,
      said: slots.raw,
      note: place.trailName,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  const ground = placeTitle({ ...state, generatedPlaces: [...(state.generatedPlaces ?? []), ...places] }, locId);

  if (slots.objects.includes("snow cave") || slots.stunts.includes("dig")) {
    hours = Math.max(hours, 3);
    extraAdd = "snow-hole";
    meters.warmth = success ? 12 : 4;
    meters.energy = success ? -10 : -14;
    if (!success) meters.health = -4;
    upsertFact(facts, {
      id: factId("shelter", "snow cave", locId),
      kind: "shelter",
      name: "snow cave",
      nouns: ["snow cave", "deadfall", "blanket"].filter((n) => n === "snow cave" || fold(slots.raw).includes(fold(n))),
      locationId: locId,
      said: slots.raw,
      note: `A snow cave under the deadfall at ${ground}. The blanket is in it.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  const line = fold(slots.raw);
  const lighting = isFireAsk(line);
  const tending = isTendAsk(line);
  const raise = raiseTarget(line);
  if (lighting) {
    hours = Math.max(hours, 1);
    const fatwood = state.inventory.extras.includes("fatwood");
    const bankedReady =
      (state.camp?.locationId === state.locationId && state.camp?.cache.extras.includes("banked-coals")) ||
      state.inventory.extras.includes("banked-coals");
    const haveWood = state.inventory.firewood > 0;
    const blizzardBlocked = state.weather === "blizzard" && !fatwood && !bankedReady;
    const canLight = haveWood && !blizzardBlocked;
    if (success && canLight) {
      lightFire = true;
      campfireHours =
        (state.weather === "blizzard" ? 4 : 10) + (state.inventory.extras.includes("fire-drill") ? 2 : 0);
      inventory = { ...(inventory ?? {}), firewood: -1 };
      meters.warmth = fatwood ? 38 : 28;
      if (bankedReady) {
        meters.warmth = (meters.warmth ?? 0) + 12;
        extraRemove = extraRemove ?? "banked-coals";
      }
      if (state.weather === "blizzard" && fatwood) extraRemove = "fatwood";
    } else if (haveWood && !blizzardBlocked && !success) {
      inventory = { ...(inventory ?? {}), firewood: -1 };
      meters.warmth = (meters.warmth ?? 0) - 2;
    }
    upsertFact(facts, {
      id: factId("act", "fire", locId),
      kind: "act",
      name: "fire",
      nouns: ["fire", ...slots.objects],
      locationId: locId,
      said: slots.raw,
      note: success && canLight ? `A fire is going at ${ground}.` : `A fire was attempted at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  } else if (tending) {
    hours = Math.max(hours, 1);
    if (state.campfire && success) {
      tendHours = state.inventory.firewood > 0 ? 3 : 0;
      if (state.inventory.firewood > 0) inventory = { ...(inventory ?? {}), firewood: -1 };
      meters.warmth = 14;
    } else if (state.campfire) {
      meters.warmth = 4;
    }
    upsertFact(facts, {
      id: factId("act", "tend fire", locId),
      kind: "act",
      name: "tend fire",
      nouns: ["fire"],
      locationId: locId,
      said: slots.raw,
      note: `The fire was tended at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  } else if (raise) {
    hours = Math.max(hours, 1);
    if (raise.kind === "raise") {
      const can = canRaise(state, raise.work);
      const work = WORKS.find((w) => w.id === raise.work);
      if (success && can.ok) {
        raiseWork = raise.work;
        hours = Math.max(hours, work?.kind === "job" ? 1 : (work?.hours ?? 1));
      }
      upsertFact(facts, {
        id: factId("act", work?.label ?? raise.work, locId),
        kind: "act",
        name: work?.label ?? raise.work,
        nouns: [work?.label ?? raise.work, "raise"],
        locationId: locId,
        said: slots.raw,
        note: success && can.ok
          ? `${work?.label ?? raise.work} started at ${ground}.`
          : `${work?.label ?? raise.work} was attempted at ${ground}. ${can.reason ?? "It did not stand."}`,
        status: "present",
        dayOfYear: state.dayOfYear,
        hour: state.hour,
      });
    } else {
      const own = atOwnCamp(state);
      const woodNeed = raise.piece === "leanTo" ? 2 : raise.piece === "woodpile" || raise.piece === "fireRing" ? 1 : 0;
      const canBuild = own && state.inventory.firewood + (state.camp?.cache.firewood ?? 0) >= woodNeed;
      if (success && canBuild) {
        buildPiece = raise.piece;
        hours = Math.max(hours, 2);
      }
      upsertFact(facts, {
        id: factId("act", raise.piece, locId),
        kind: "act",
        name: raise.piece === "leanTo" ? "lean-to" : raise.piece,
        nouns: [raise.piece === "leanTo" ? "lean-to" : raise.piece],
        locationId: locId,
        said: slots.raw,
        note: success && canBuild
          ? `The ${raise.piece === "leanTo" ? "lean-to" : raise.piece} stands at ${ground}.`
          : `The ${raise.piece === "leanTo" ? "lean-to" : raise.piece} was attempted at ${ground}.`,
        status: "present",
        dayOfYear: state.dayOfYear,
        hour: state.hour,
      });
    }
  } else if (isWoodAsk(line) && !slots.objects.includes("snow cave")) {
    hours = Math.max(hours, 2);
    inventory = { ...(inventory ?? {}), firewood: success ? 2 : 1 };
    upsertFact(facts, {
      id: factId("object", "firewood", locId),
      kind: "object",
      name: "firewood",
      nouns: ["firewood", ...slots.objects],
      locationId: locId,
      said: slots.raw,
      note: `Firewood taken at ${ground}. The walk for it still counts.`,
      status: "carried",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
    extras.push(success ? "Two armfuls. The hour bought wood." : "One armful. The hour still bought wood.");
  } else if (isWaterAsk(line)) {
    hours = Math.max(hours, 1);
    inventory = { ...(inventory ?? {}), water: success ? 2 : 1 };
    upsertFact(facts, {
      id: factId("act", "water", locId),
      kind: "act",
      name: "water",
      nouns: ["water", ...slots.objects],
      locationId: locId,
      said: slots.raw,
      note: `Water taken at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  if (slots.objects.includes("drowned doe") || (fold(slots.raw).includes("doe") && slots.stunts.includes("cut"))) {
    hours = Math.max(hours, (walk ? walk.hours : 0) + 2);
    inventory = { rations: success ? 2 : 1 };
    if (!success) meters.health = (meters.health ?? 0) - 6;
    upsertFact(facts, {
      id: factId("animal", "drowned doe", locId),
      kind: "animal",
      name: "drowned doe",
      nouns: ["drowned doe", "doe", "ice", "meat"],
      locationId: locId,
      said: slots.raw,
      note: `A drowned doe jammed in the ice at ${ground}. Meat has been cut from her.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  if (slots.song || slots.stunts.includes("sing")) {
    hours = Math.max(hours, 1);
    const song = slots.song ?? "a song";
    upsertFact(facts, {
      id: factId("act", song, locId),
      kind: "act",
      name: song,
      nouns: [song, "song"],
      locationId: locId,
      characterId: present ?? undefined,
      said: slots.raw,
      note: `You sang the ${song} at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
    if (present) standing = { id: present, delta: success ? 1 : 0 };
  }

  const giftExtra = extraFromGift(slots.gift, state);
  if (slots.gift) {
    hours = Math.max(hours, 1);
    if (giftExtra && giftExtra !== "pelt") extraRemove = giftExtra;
    if (giftExtra === "pelt") inventory = { ...(inventory ?? {}), pelts: -1 };
    if (present) standing = { id: present, delta: (standing?.delta ?? 0) + 1 };
    upsertFact(facts, {
      id: factId("act", `gift ${slots.gift}`, locId),
      kind: "act",
      name: `gift of ${slots.gift}`,
      nouns: [slots.gift, "gift"],
      locationId: locId,
      said: slots.raw,
      note: `A gift of ${slots.gift} changed hands at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  if (slots.stunts.includes("climb")) {
    hours = Math.max(hours, 2);
    const snag = slots.objects.find((o) => o.includes("snag") || o.includes("pine")) ?? "snag";
    if (!success) meters.health = (meters.health ?? 0) - 8;
    upsertFact(facts, {
      id: factId("object", snag, locId),
      kind: "object",
      name: snag,
      nouns: [snag],
      locationId: locId,
      said: slots.raw,
      note: `You climbed the ${snag} at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  for (const person of slots.people) {
    if (person.known && person.id) {
      present = person.id;
      if (slots.lie) standing = { id: person.id, delta: success ? 0 : -1 };
      if (slots.accuse) standing = { id: person.id, delta: -1 };
      continue;
    }
    const gen = makePerson(state, person.name, locId);
    people.push(gen);
    present = gen.id;
    const kettle = slots.objects.find((o) => o.includes("kettle"));
    rumors.push(`${gen.name} was seen at ${ground}${kettle ? `, owing a ${kettle}` : ""}.`);
    upsertFact(facts, {
      id: factId("person", gen.name, locId),
      kind: "person",
      name: gen.name,
      nouns: [gen.name, ...(kettle ? [kettle] : [])],
      locationId: locId,
      characterId: gen.id,
      said: slots.raw,
      note: kettle ? `${gen.name} owes a ${kettle}.` : `${gen.name} is on this ground.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
    if (kettle) {
      extraAdd = extraAdd ?? `owed-${slug(kettle)}`;
      upsertFact(facts, {
        id: factId("object", kettle, locId),
        kind: "object",
        name: kettle,
        nouns: [kettle],
        locationId: locId,
        characterId: gen.id,
        said: slots.raw,
        note: `The ${kettle} is owed by ${gen.name}.`,
        status: "present",
        dayOfYear: state.dayOfYear,
        hour: state.hour,
      });
    }
  }

  if (slots.lie || slots.accuse) {
    const who = slots.people[0];
    upsertFact(facts, {
      id: factId("act", slots.lie ? "lie" : "accusation", locId),
      kind: "act",
      name: slots.lie ? "lie" : "accusation",
      nouns: [slots.lie ? "lie" : "accusation", who?.name ?? "them"],
      locationId: locId,
      characterId: who?.id,
      said: slots.raw,
      note: slots.lie ? `A lie was told to ${who?.name ?? "someone"} at ${ground}.` : `An accusation was made at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  const portable = slots.objects.find((o) => /whistle|compass|kettle|ticket|bead|cup|tin/.test(o) && !o.includes("owed"));
  if (portable && slots.stunts.includes("meet") === false && !slots.objects.includes("drowned doe")) {
    if (
      !extraAdd &&
      (fold(slots.raw).includes("keep") || fold(slots.raw).includes("pick") || fold(slots.raw).includes("found"))
    ) {
      extraAdd = slug(portable);
      upsertFact(facts, {
        id: factId("object", portable, locId),
        kind: "object",
        name: portable,
        nouns: [portable],
        locationId: locId,
        said: slots.raw,
        note: `The ${portable} is in the pack.`,
        status: "carried",
        dayOfYear: state.dayOfYear,
        hour: state.hour,
      });
    }
  }

  if (
    facts.length === 0 &&
    slots.objects[0] &&
    (slots.stunts.includes("search") || /\b(pick up|pocket|stow|take the)\b/.test(line))
  ) {
    const obj = slots.objects[0];
    extraAdd = extraAdd ?? slug(obj);
    upsertFact(facts, {
      id: factId("object", obj, locId),
      kind: "object",
      name: obj,
      nouns: [obj, ...slots.objects],
      locationId: locId,
      said: slots.raw,
      note: `The ${obj} is in the pack. You took it at ${ground}.`,
      status: "carried",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  if (facts.length === 0) {
    const name = slots.objects[0] ?? actTitle(slots.raw);
    upsertFact(facts, {
      id: factId("act", name, locId),
      kind: "act",
      name,
      nouns: Array.from(new Set([...slots.objects, ...contentTokens(slots.raw).slice(0, 6)])),
      locationId: locId,
      said: slots.raw,
      note: `${sentence(slots.raw)} It happened at ${ground}.`,
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  const narration = narrate(state, slots, ground, success, extras);
  let encounter = residualEncounter(facts, narration);
  if (present && encounter.characterId == null && (slots.song || slots.gift || slots.lie || slots.accuse)) {
    encounter = { ...encounter, characterId: present };
  }

  return {
    risky: die.risky,
    trait: die.trait,
    dc: die.dc,
    label: die.label,
    hours,
    relocate,
    meters,
    inventory,
    extraAdd,
    extraRemove,
    standing,
    facts,
    people,
    places,
    rumors,
    presentCharacterId: present,
    narration,
    encounter,
    focusFactIds: facts.map((f) => f.id),
    lightFire,
    campfireHours,
    tendHours,
    raiseWork,
    buildPiece,
  };
}

export function planDie(text: string): { trait: Trait; dc: number; label: string; hours: number } {
  const line = fold(text);
  if (/\bhunt|shoot|rifle|elk|deer\b/.test(line)) return { trait: "eye", dc: 12, label: "The shot", hours: 2 };
  if (/\bask|talk|speak|trade\b/.test(line)) return { trait: "savvy", dc: 11, label: "The words", hours: 1 };
  if (/\bscout|track|sign\b/.test(line)) return { trait: "savvy", dc: 12, label: "The ground", hours: 2 };
  return { trait: "savvy", dc: 13, label: "The act", hours: 1 };
}

export const TEMPLATE_MARKERS = [
  /you put it in motion/i,
  /sign turns into an animal/i,
  /you try:/i,
  /hunt goes your way/i,
  /the mountain does not comment/i,
  /the mountain answers/i,
  /that is now a fact of this run/i,
  /\{intent\}/,
  /BODY\[/,
];

export function looksLikeTemplate(text: string): boolean {
  return TEMPLATE_MARKERS.some((re) => re.test(text));
}
