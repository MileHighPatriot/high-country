import { characterOf, locationOf, placeTitle } from "@/lib/game/atlas";
import { CHARACTERS } from "@/lib/game/content/characters";
import { LOCATIONS } from "@/lib/game/content/locations";
import { trailHours } from "@/lib/game/readout";
import type {
  CharacterId,
  EncounterChoice,
  EncounterDef,
  GameState,
  GeneratedPerson,
  GeneratedPlace,
  LocationId,
  Meters,
  Outcome,
  StoryFact,
  StoryFactKind,
  Trait,
} from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

export type CampVerb = "eat" | "drink" | "sleep";

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

export function campVerbOf(text: string): CampVerb | null {
  const line = fold(text).replace(/\.$/, "");
  if (/^(i )?(eat|chew a ration|take a bite)$/.test(line)) return "eat";
  if (/^(i )?(drink|drink water|fill the tin and drink)$/.test(line)) return "drink";
  if (/^(i )?(sleep|go to sleep|go to bed|lie down)$/.test(line)) return "sleep";
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
  ];
  for (const c of compounds) {
    if (line.includes(c) && !found.includes(c)) found.push(c);
  }
  const re = /\b(?:a|an|the|my|his|her|this|that)\s+([a-z]+(?:\s+[a-z]+){0,3})/g;
  let m: RegExpExecArray | null;
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
  return found.slice(0, 6);
}

function extractStunts(line: string): string[] {
  const stunts: string[] = [];
  const verbs: Array<[RegExp, string]> = [
    [/\bdig|\bsnow cave/, "dig"],
    [/\bdrag|\bpull/, "drag"],
    [/\bwait the blow|\bwait it out|\bwait out/, "wait-blow"],
    [/\bcut meat|\bbutcher|\bskin|\bcarve/, "cut"],
    [/\bwalk to|\bgo to|\bhead to|\bmake for/, "walk"],
    [/\bsing|\bsong|\bchanson/, "sing"],
    [/\bclimb/, "climb"],
    [/\baccus/, "accuse"],
    [/\blie to|\blying to|\btell a lie|\bI lie\b/, "lie"],
    [/\bgive|\bgift/, "gift"],
    [/\bmeet|\bfind a man|\bfind a woman|\ba trapper/, "meet"],
    [/\binvent|\bside trail|\boff the (map|trail)/, "invent-trail"],
  ];
  for (const [re, name] of verbs) {
    if (re.test(line) && !stunts.includes(name)) stunts.push(name);
  }
  return stunts;
}

function parseSlots(state: GameState, text: string): Slots {
  const raw = text.trim().replace(/\s+/g, " ");
  const line = fold(raw);
  const place = findPlace(state, line);
  const walking = /\bwalk to\b|\bgo to\b|\bhead to\b|\bmake for\b|\bi walk\b/.test(line);
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
  if (slots.stunts.includes("dig") || slots.objects.includes("snow cave")) {
    return {
      risky: true,
      trait: state.weather === "blizzard" ? "grit" : "hands",
      dc: state.weather === "blizzard" ? 13 : 12,
      label: obj ? `Dig the ${obj}` : "Dig a cave",
    };
  }
  if (slots.stunts.includes("cut") || slots.objects.includes("drowned doe")) {
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
    return { risky: Boolean(state.presentCharacterId), trait: "savvy", dc: 11, label: slots.song ?? "Sing" };
  }
  if (/\bscout|track|read sign|read the ground/.test(fold(slots.raw))) {
    return { risky: true, trait: "savvy", dc: 12, label: "Read the ground" };
  }
  if (slots.stunts.includes("walk") && slots.travelTo) {
    return { risky: state.weather === "blizzard", trait: "grit", dc: 13, label: `Walk to ${slots.travelName}` };
  }
  return { risky: false, trait: "savvy", dc: 12, label: "Do it" };
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

function caveEncounter(fact: StoryFact, ground: string): EncounterDef {
  return {
    id: `gm-${fact.id}`,
    repeatable: true,
    text: `The ${fact.name} under the deadfall still holds at ${ground}. Your blanket is in it. The blow works the ridge, not the mouth, if you stay.`,
    choices: [
      {
        id: "stay",
        label: "Stay in the snow cave",
        outcome: {
          text: `You stay in the snow cave. Hours go. The deadfall keeps its promise. You are still in the cave.`,
          hours: 3,
          meters: { warmth: 10, energy: -4 },
          extraAdd: "snow-hole",
          followUpEncounter: `gm-${fact.id}`,
        },
      },
      {
        id: "bank",
        label: "Bank the mouth of the snow cave",
        outcome: {
          text: `You bank the mouth of the snow cave with snow. The blanket stays. The blow finds less of you.`,
          hours: 1,
          meters: { warmth: 8, energy: -6 },
          extraAdd: "snow-hole",
          followUpEncounter: `gm-${fact.id}`,
        },
      },
      {
        id: "out",
        label: "Crawl out of the snow cave",
        outcome: {
          text: `You crawl out of the snow cave. The deadfall is a roof you left. The cave remains at ${ground} if you come back.`,
          hours: 1,
          extraRemove: "snow-hole",
        },
      },
    ],
  };
}

function doeEncounter(fact: StoryFact, ground: string): EncounterDef {
  return {
    id: `gm-${fact.id}`,
    repeatable: true,
    text: `The drowned doe is still jammed in the ice at ${ground}. Meat is a fact you can return to.`,
    choices: [
      {
        id: "more",
        label: "Cut more from the drowned doe",
        check: { trait: "hands", dc: 12 },
        success: {
          text: `You cut more from the drowned doe jammed in the ice. The carcass still hangs in the creek.`,
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -8 },
          followUpEncounter: `gm-${fact.id}`,
        },
        fail: {
          text: `The ice around the drowned doe shifts. You keep your fingers. You get less meat.`,
          hours: 2,
          meters: { health: -4, energy: -8 },
          followUpEncounter: `gm-${fact.id}`,
        },
      },
      {
        id: "leave",
        label: "Leave the drowned doe in the ice",
        outcome: {
          text: `You leave the drowned doe jammed in the ice at ${ground}. She will keep in this cold.`,
          hours: 1,
        },
      },
      {
        id: "up",
        label: "Follow the creek up from the doe",
        outcome: {
          text: `You leave the drowned doe and follow the creek up. The carcass stays a mark on this ice.`,
          hours: 2,
          meters: { energy: -6 },
        },
      },
    ],
  };
}

function personEncounter(person: GeneratedPerson, fact: StoryFact, extra: string | null): EncounterDef {
  const kettle = extra ?? fact.nouns.find((n) => n.includes("kettle")) ?? "what they owe";
  return {
    id: `gm-${fact.id}`,
    repeatable: true,
    characterId: person.id,
    text: `${person.name} is still here. ${fact.note}`,
    choices: [
      {
        id: "ask",
        label: `Ask ${person.name} about the ${kettle}`,
        outcome: {
          text: `You ask ${person.name} about the ${kettle}. They do not pretend it is weather.`,
          hours: 1,
          standing: { id: person.id, delta: 1 },
          presentCharacter: person.id,
          followUpEncounter: `gm-${fact.id}`,
        },
      },
      {
        id: "walk",
        label: `Walk on with ${person.name} in mind`,
        outcome: {
          text: `${person.name} remains a fact of this country. The ${kettle} is not settled.`,
          hours: 1,
          presentCharacter: null,
        },
      },
      {
        id: "stay",
        label: `Stay with ${person.name}`,
        outcome: {
          text: `You stay with ${person.name}. The hour is company, not charity.`,
          hours: 2,
          presentCharacter: person.id,
          followUpEncounter: `gm-${fact.id}`,
        },
      },
    ],
  };
}

function genericEncounter(facts: StoryFact[], ground: string, said: string): EncounterDef {
  const lead = facts[0];
  const name = lead?.name ?? "what you did";
  const id = `gm-${lead?.id ?? slug(said)}`;
  return {
    id,
    repeatable: true,
    text: `${sentence(lead?.note ?? said)} You are still at ${ground}, and ${name} is still the hour.`,
    choices: [
      {
        id: "continue",
        label: `Keep on with the ${name}`,
        outcome: {
          text: `You keep on with the ${name} at ${ground}. The next hour is still that story.`,
          hours: 2,
          meters: { energy: -4 },
          followUpEncounter: id,
        },
      },
      {
        id: "wait",
        label: `Wait here with the ${name}`,
        outcome: {
          text: `You wait with the ${name}. ${ground} does not hurry.`,
          hours: 3,
          followUpEncounter: id,
        },
      },
      {
        id: "leave",
        label: `Leave the ${name} for now`,
        outcome: {
          text: `You leave the ${name} as a fact at ${ground}. It does not unhappen.`,
          hours: 1,
        },
      },
    ],
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

  if (bits.length === 0) {
    bits.push(sentence(slots.raw));
    bits.push(`That is the hour at ${locName}.`);
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

  if (facts.length === 0) {
    const name = slots.objects[0] ?? slots.stunts[0] ?? "the act";
    upsertFact(facts, {
      id: factId("act", name, locId),
      kind: "act",
      name,
      nouns: slots.objects.length ? slots.objects : [name],
      locationId: locId,
      said: slots.raw,
      note: sentence(slots.raw),
      status: "present",
      dayOfYear: state.dayOfYear,
      hour: state.hour,
    });
  }

  const narration = narrate(state, slots, ground, success, extras);
  const caveFact = facts.find((f) => f.kind === "shelter");
  const doeFact = facts.find((f) => f.kind === "animal");
  const personFact = facts.find((f) => f.kind === "person");
  const genPerson = people[0];
  let encounter: EncounterDef;
  if (caveFact) encounter = caveEncounter(caveFact, ground);
  else if (doeFact) encounter = doeEncounter(doeFact, ground);
  else if (personFact && genPerson) encounter = personEncounter(genPerson, personFact, slots.objects.find((o) => o.includes("kettle")) ?? null);
  else encounter = genericEncounter(facts, ground, slots.raw);

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
  /\{intent\}/,
  /BODY\[/,
];

export function looksLikeTemplate(text: string): boolean {
  return TEMPLATE_MARKERS.some((re) => re.test(text));
}
