import { CHARACTER_BY_ID, CHARACTERS } from "@/lib/game/content/characters";
import { LOCATION_BY_ID, LOCATIONS } from "@/lib/game/content/locations";
import type {
  AttemptVector,
  CharacterId,
  EncounterChoice,
  EncounterDef,
  GameAction,
  GameState,
  LocationId,
  SkirmishMove,
  Trait,
} from "@/lib/game/types";
import { peopleAt, nextHop } from "@/lib/game/world";

export interface AttemptPlan {
  trait: Trait;
  dc: number;
  label: string;
  hours: number;
  vector: AttemptVector;
  intent: string;
  subject: string;
  complex: boolean;
  /** Dispatch this camp/trail verb instead of improvising. */
  verb?: GameAction;
  /** They described a presented option, in their own words. */
  choiceId?: string;
  choiceFrame?: EncounterChoice;
  personId?: CharacterId;
  locationId?: LocationId;
  skirmishMove?: SkirmishMove;
  /** Skip the die — looking, leaving, eating, and other quiet acts. */
  quiet?: boolean;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "my",
  "me",
  "i",
  "we",
  "you",
  "it",
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "that",
  "this",
  "then",
  "than",
  "into",
  "onto",
  "out",
  "up",
  "down",
  "off",
  "over",
  "some",
  "any",
  "do",
  "did",
  "will",
  "would",
  "could",
  "should",
  "can",
  "just",
  "like",
  "about",
  "around",
  "try",
  "trying",
  "choose",
  "want",
  "gonna",
  "going",
  "decide",
  "please",
  "to",
  "is",
  "be",
  "am",
  "are",
  "was",
  "if",
  "but",
  "not",
  "no",
  "yes",
  "here",
  "there",
  "them",
  "they",
  "their",
  "his",
  "her",
  "our",
  "your",
]);

const VECTOR_RULES: Array<{ re: RegExp; vector: AttemptVector; trait: Trait; dc: number; label: string; hours: number }> = [
  { re: /\b(hunt|shoot|rifle|elk|deer|doe|game|kill an? |take meat|cut meat)\b/, vector: "hunt", trait: "eye", dc: 12, label: "Hunt", hours: 2 },
  { re: /\b(fish|hook|line|ice hole|angling)\b/, vector: "fish", trait: "hands", dc: 12, label: "Fish", hours: 2 },
  { re: /\b(aim|watch|spot|lookout|glass|look at|look around|survey)\b/, vector: "watch", trait: "eye", dc: 11, label: "Watch the ground", hours: 1 },
  { re: /\b(inspect|examine|study|read the|what is|search the|search for|forage|look for)\b/, vector: "search", trait: "savvy", dc: 12, label: "Search", hours: 2 },
  { re: /\b(scout|track|sign|follow|trail)\b/, vector: "scout", trait: "savvy", dc: 12, label: "Read sign", hours: 2 },
  { re: /\b(trade|bargain|buy|sell|barter)\b/, vector: "trade", trait: "savvy", dc: 12, label: "Trade", hours: 1 },
  { re: /\b(ask|talk|speak|tell|say |greet|convince|persuade|listen)\b/, vector: "talk", trait: "savvy", dc: 11, label: "Speak", hours: 1 },
  { re: /\b(give|share|offer|hand (him|her|them)|rations? to)\b/, vector: "give", trait: "savvy", dc: 10, label: "Give", hours: 1 },
  { re: /\b(help|aid|tend (his|her|their)|bandage|save)\b/, vector: "help", trait: "hands", dc: 12, label: "Help", hours: 2 },
  { re: /\b(steal|take from|pickpocket|rob|lift |swipe)\b/, vector: "steal", trait: "savvy", dc: 14, label: "Take what is not yours", hours: 1 },
  { re: /\b(threaten|intimidate|point (the )?rifle|menace)\b/, vector: "threaten", trait: "grit", dc: 13, label: "Push them", hours: 1 },
  { re: /\b(attack|fight|stab|knife|punch|strike|shoot (him|her|them)|kill (him|her|them))\b/, vector: "fight", trait: "hands", dc: 13, label: "Violence", hours: 1 },
  { re: /\b(climb|scale|scramble|up the)\b/, vector: "climb", trait: "hands", dc: 13, label: "Climb", hours: 2 },
  { re: /\b(sneak|hide|creep|quiet|stalk)\b/, vector: "sneak", trait: "savvy", dc: 13, label: "Go quiet", hours: 1 },
  { re: /\b(hide behind|take cover|duck)\b/, vector: "hide", trait: "savvy", dc: 12, label: "Get small", hours: 1 },
  { re: /\b(pray|god|lord|sing|hymn)\b/, vector: "pray", trait: "grit", dc: 10, label: "Pray", hours: 1 },
  { re: /\b(push|endure|wait out|grit|hold on|push through)\b/, vector: "endure", trait: "grit", dc: 13, label: "Endure", hours: 2 },
  { re: /\b(storm|blizzard|weather|wind)\b/, vector: "weather", trait: "grit", dc: 13, label: "Meet the weather", hours: 2 },
  { re: /\b(snow-?hole|snow cave|lean-?to|shelter|dig in)\b/, vector: "shelter", trait: "hands", dc: 12, label: "Make shelter", hours: 2 },
  { re: /\b(pitch camp|make camp|strike camp|break camp)\b/, vector: "camp", trait: "hands", dc: 11, label: "Camp", hours: 2 },
  { re: /\b(cook|boil|stew|fry)\b/, vector: "cook", trait: "hands", dc: 11, label: "Cook", hours: 1 },
  { re: /\b(build|mend|make|spark|skin|sew|cut ice|lash|fix|craft)\b/, vector: "craft", trait: "hands", dc: 12, label: "Work with the hands", hours: 2 },
  { re: /\b(fire|kindle|embers|tend the fire)\b/, vector: "fire", trait: "hands", dc: 11, label: "Fire", hours: 1 },
  { re: /\b(drink|water|canteen|fill (the )?jugs?)\b/, vector: "water", trait: "hands", dc: 11, label: "Water", hours: 1 },
  { re: /\b(wood|deadfall|firewood|drop a tree|chop)\b/, vector: "wood", trait: "hands", dc: 12, label: "Wood", hours: 2 },
  { re: /\b(eat|ration|chew|supper|breakfast)\b/, vector: "eat", trait: "grit", dc: 8, label: "Eat", hours: 1 },
  { re: /\b(sleep|rest|nap|lie down|bed down)\b/, vector: "sleep", trait: "grit", dc: 10, label: "Sleep", hours: 6 },
  { re: /\b(wait|sit|stay put|hold here)\b/, vector: "wait", trait: "grit", dc: 8, label: "Wait", hours: 3 },
  { re: /\b(flee|run|retreat|back away|walk away|leave|get out)\b/, vector: "flee", trait: "grit", dc: 11, label: "Leave", hours: 1 },
  { re: /\b(follow (him|her|them|the)|go after|catch up)\b/, vector: "follow", trait: "savvy", dc: 12, label: "Follow", hours: 2 },
  { re: /\b(go to|head to|walk to|travel|set out|make for|toward)\b/, vector: "travel", trait: "grit", dc: 11, label: "Travel", hours: 3 },
];

const SKIRMISH: Array<{ re: RegExp; move: SkirmishMove }> = [
  { re: /\b(fire|shoot|aim|rifle|powder|gun)\b/, move: "fire" },
  { re: /\b(knife|close|charge|stab|cut|rush|grapple)\b/, move: "close" },
  { re: /\b(cover|hide|duck|down|rock|tree)\b/, move: "cover" },
  { re: /\b(eat|drink|ration|water|item|bandage)\b/, move: "item" },
  { re: /\b(flee|run|retreat|back|leave)\b/, move: "flee" },
];

const PLACE_ALIAS: Array<{ re: RegExp; id: LocationId }> = [
  { re: /\bhigh camp\b/, id: "high-camp" },
  { re: /\b(frozen )?creek\b/, id: "creek" },
  { re: /\btimberline\b/, id: "timberline" },
  { re: /\bute( hunting)? camp\b/, id: "ute-camp" },
  { re: /\b(abandoned )?cabin\b/, id: "abandoned-cabin" },
  { re: /\bsouth pass\b/, id: "south-pass" },
  { re: /\bbeaver meadow\b/, id: "beaver-meadow" },
  { re: /\bburned timber\b|\bthe burn\b/, id: "burned-timber" },
  { re: /\bavalanche( chute)?\b/, id: "avalanche-chute" },
  { re: /\bhot spring\b/, id: "hot-spring" },
  { re: /\belk wallow\b|\bwallow\b/, id: "elk-wallow" },
  { re: /\bwind[- ]?saddle\b|\bsaddle\b/, id: "wind-saddle" },
  { re: /\bfrozen fall\b|\bice fall\b/, id: "frozen-fall" },
  { re: /\blightning pine\b|\bsplit snag\b/, id: "lightning-pine" },
  { re: /\bmexican trail\b/, id: "mexican-trail-camp" },
  { re: /\barapaho\b/, id: "arapaho-ground" },
  { re: /\bcache\b|\bdeadfall\b/, id: "cache-deadfall" },
  { re: /\bice cave\b|\btalus\b/, id: "talus-ice-cave" },
  { re: /\bhomesteader\b|\bruin\b/, id: "homesteader-ruin" },
  { re: /\bgrizzly\b|\bbasin\b/, id: "grizzly-basin" },
  { re: /\bsouth park\b|\brim\b/, id: "south-park-rim" },
];

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clipIntent(text: string, max = 140): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function normalizeIntent(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(i\s+)?((try|choose|want|decide|am going|am gonna|gonna|going)(\s+to)?)\s+/i, "")
    .replace(/^to\s+/i, "");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function distinctiveWords(text: string): string[] {
  return tokenize(text).filter((w) => w.length > 3);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function detectVector(line: string): (typeof VECTOR_RULES)[number] | null {
  for (const rule of VECTOR_RULES) {
    if (rule.re.test(line)) return rule;
  }
  return null;
}

function matchPlace(line: string): LocationId | undefined {
  for (const loc of LOCATIONS) {
    const name = loc.name.toLowerCase();
    if (name.length > 3 && line.includes(name)) return loc.id;
  }
  for (const alias of PLACE_ALIAS) {
    if (alias.re.test(line)) return alias.id;
  }
  return undefined;
}

function personNeedle(person: { id: string; name: string }): string[] {
  const name = person.name.toLowerCase();
  const bits = name.split(/\s+/).filter((w) => w.length > 2);
  const idBits = person.id.split("-").filter((w) => w.length > 2);
  return Array.from(new Set([name, ...bits, ...idBits]));
}

function matchPerson(state: GameState | undefined, line: string): CharacterId | undefined {
  const here = state ? peopleAt(state).map((p) => p.id) : [];
  const present = here
    .map((id) => CHARACTER_BY_ID[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const pool = present.length ? present : CHARACTERS;
  let best: { id: CharacterId; score: number } | null = null;
  for (const person of pool) {
    let score = 0;
    for (const needle of personNeedle(person)) {
      if (needle.length < 4 && !here.includes(person.id)) continue;
      if (line.includes(needle)) score += needle.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: person.id, score };
  }
  if (best) return best.id;
  if (present.length === 1 && /\b(him|her|them|the (man|woman|stranger|person))\b/.test(line)) {
    return present[0]!.id;
  }
  if (state?.presentCharacterId && /\b(him|her|them)\b/.test(line)) return state.presentCharacterId;
  if (state?.companionId && /\b(companion|partner)\b/.test(line)) return state.companionId;
  return undefined;
}

function overlapScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const t of a) if (setB.has(t)) hit += 1;
  return hit / Math.max(1, Math.min(a.length, b.length));
}

export function matchEncounterChoice(text: string, enc: EncounterDef | null | undefined): EncounterChoice | undefined {
  if (!enc?.choices.length) return undefined;
  const line = normalizeIntent(text).toLowerCase();
  const intentTok = tokenize(line);
  let best: { choice: EncounterChoice; score: number; hits: number } | null = null;
  for (const choice of enc.choices) {
    const label = choice.label.toLowerCase();
    if (line.includes(label) || (line.length > 12 && label.includes(line))) {
      return choice;
    }
    const labelTok = tokenize(label);
    const hits = intentTok.filter((t) => labelTok.includes(t)).length;
    const score = overlapScore(intentTok, labelTok);
    if (!best || hits > best.hits || (hits === best.hits && score > best.score)) {
      best = { choice, score, hits };
    }
  }
  if (best && best.hits >= 2 && best.score >= 0.4) return best.choice;
  return undefined;
}

function skirmishMove(line: string): SkirmishMove | undefined {
  for (const rule of SKIRMISH) {
    if (rule.re.test(line)) return rule.move;
  }
  return undefined;
}

function verbFor(state: GameState | undefined, plan: Omit<AttemptPlan, "verb">): GameAction | undefined {
  if (!state) return undefined;
  const v = plan.vector;
  if (v === "eat") return { type: "eat" };
  if (v === "drink" || v === "water") {
    const loc = LOCATION_BY_ID[state.locationId];
    if (v === "water" || loc?.tags.includes("water") || state.locationId === "hot-spring" || state.locationId === "creek") {
      if (/\b(drink|sip|canteen)\b/.test(plan.intent.toLowerCase()) && state.inventory.water > 0) return { type: "drink" };
      if (v === "water") return { type: "gatherWater" };
    }
    if (v === "drink") return { type: "drink" };
  }
  if (v === "sleep") return { type: "sleep" };
  if (v === "wait") return { type: "wait" };
  if (v === "talk" && (plan.personId || state.presentCharacterId)) return { type: "talk" };
  if (v === "fire") return state.campfire ? { type: "tendFire" } : { type: "makeFire" };
  if (v === "wood") return { type: "gatherWood" };
  if (v === "hunt") return { type: "hunt" };
  if (v === "fish") return { type: "fish" };
  if (v === "scout" || v === "follow") return { type: "scout" };
  if (v === "pray") return { type: "pray" };
  if (v === "cook") return { type: "cook" };
  if (v === "shelter") return { type: "shelterUp" };
  if (v === "camp") {
    if (/\bstrike|break camp\b/.test(plan.intent.toLowerCase())) return { type: "strikeCamp" };
    return { type: "pitchCamp" };
  }
  if (v === "craft" && /\bmend|boots|kit|rifle\b/.test(plan.intent.toLowerCase())) return { type: "mend" };
  if (v === "search" && /\bsnare\b/.test(plan.intent.toLowerCase())) return { type: "checkSnares" };
  if (v === "travel" && plan.locationId && plan.locationId !== state.locationId) {
    const loc = LOCATION_BY_ID[state.locationId];
    if (loc?.connections.some((c) => c.to === plan.locationId)) return { type: "travel", to: plan.locationId };
    const hop = nextHop(state.locationId, plan.locationId);
    if (hop) return { type: "travel", to: hop };
  }
  return undefined;
}

function isQuiet(plan: Pick<AttemptPlan, "vector" | "complex" | "choiceFrame">): boolean {
  if (plan.choiceFrame?.check) return false;
  if (plan.choiceFrame && !plan.choiceFrame.check) return true;
  if (plan.complex) return false;
  return plan.vector === "inspect" || plan.vector === "watch" || plan.vector === "wait" || plan.vector === "eat" || plan.vector === "drink" || plan.vector === "flee";
}

function isSimple(text: string, plan: Pick<AttemptPlan, "vector" | "personId" | "locationId">): boolean {
  const n = wordCount(text);
  if (n > 8) return false;
  if (/\b(because|then|after|before|while|so that|and then)\b/.test(text.toLowerCase())) return false;
  if (plan.vector === "travel" && plan.locationId) return n <= 10;
  if (plan.vector === "talk" && plan.personId && n <= 6) return true;
  return n <= 7;
}

export function shouldDispatchVerb(state: GameState, plan: AttemptPlan): boolean {
  if (!plan.verb) return false;
  if (plan.choiceFrame) return false;
  if (state.skirmish) return false;
  if (plan.complex) return false;
  if (state.activeEncounterId) {
    const t = plan.verb.type;
    return t === "travel" || t === "wait" || t === "talk" || t === "partWays";
  }
  return true;
}

export function interpretAttempt(text: string, state?: GameState, enc?: EncounterDef | null): AttemptPlan {
  const raw = clipIntent(text, 200);
  const intent = normalizeIntent(raw);
  const line = intent.toLowerCase();
  const personId = matchPerson(state, line);
  const namedPlace = matchPlace(line);
  const locationId =
    namedPlace && namedPlace !== state?.locationId
      ? namedPlace
      : personId && state?.world?.people[personId] && state.world.people[personId]!.locationId !== state.locationId
        ? state.world.people[personId]!.locationId
        : namedPlace;
  const rule = detectVector(line);
  const choice = matchEncounterChoice(raw, enc);
  let vector: AttemptVector = rule?.vector ?? "other";
  if (!rule) {
    if (locationId) vector = "travel";
    else if (personId) vector = "talk";
    else if (/\blook\b/.test(line)) vector = "inspect";
    else vector = "other";
  }
  if (choice && vector === "other") {
    if (choice.check?.trait === "eye") vector = "watch";
    else if (choice.check?.trait === "hands") vector = "craft";
    else if (choice.check?.trait === "grit") vector = "endure";
    else vector = "talk";
  }
  if (personId && (vector === "hunt" || /\b(shoot|kill|attack)\b/.test(line)) && !/\b(elk|deer|game|meat|animal|wolf|cat|bear|sow)\b/.test(line)) {
    vector = /\b(shoot|kill|attack|stab|knife|punch|fight)\b/.test(line) ? "fight" : "follow";
  }
  if (vector === "fight" && !personId && !/\b(him|her|them|man|woman|wolf|bear|cat|sow|person|stranger|foe|bandit)\b/.test(line)) {
    vector = "endure";
  }

  let trait: Trait = choice?.check?.trait ?? rule?.trait ?? (vector === "travel" ? "grit" : "savvy");
  if (!choice?.check) {
    if (vector === "fight") trait = "hands";
    if (vector === "follow") trait = "savvy";
    if (vector === "travel") trait = "grit";
    if (vector === "inspect") trait = "eye";
    if (vector === "endure") trait = "grit";
  }
  const dc = choice?.check?.dc ?? (vector === "fight" ? 13 : vector === "other" ? 13 : rule?.dc ?? 12);
  const hours = rule?.hours ?? (vector === "travel" ? 3 : 1);
  const label = choice?.label ?? rule?.label ?? "Try it";
  const subject = distinctiveWords(intent).slice(0, 6).join(" ") || intent;
  const complex = !isSimple(intent, { vector, personId, locationId });

  const plan: AttemptPlan = {
    trait,
    dc,
    label,
    hours,
    vector,
    intent: raw,
    subject,
    complex,
    choiceId: choice?.id,
    choiceFrame: choice,
    personId,
    locationId,
    skirmishMove: state?.skirmish ? skirmishMove(line) ?? "cover" : undefined,
    quiet: false,
  };
  plan.verb = verbFor(state, plan);
  plan.quiet = isQuiet(plan) && !plan.verb;
  if (vector === "inspect" || vector === "watch") {
    if (!plan.complex && !choice?.check) plan.quiet = true;
  }
  return plan;
}

/** Trait map used by older tests — text only, no world. */
export function planAttempt(text: string): AttemptPlan {
  return interpretAttempt(text);
}

export function intentSeed(state: GameState, text: string): number {
  return (hashString(text) ^ state.rngSeed ^ hashString(state.locationId) ^ (state.dayOfYear * 1009 + state.hour * 17)) >>> 0;
}
