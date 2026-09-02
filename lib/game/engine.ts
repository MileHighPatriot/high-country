import { CHARACTER_BY_ID, CHARACTERS } from "@/lib/game/content/characters";
import { choreEncounter, choreKindFromId, forageOutcome, waitFlavor } from "@/lib/game/content/chores";
import { allEncounters } from "@/lib/game/content/index";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { withBase } from "@/lib/paths";
import type {
  CharacterId,
  Choice,
  DeathCause,
  EncounterChoice,
  EncounterDef,
  GameAction,
  GameState,
  Kit,
  LocationId,
  LogEntry,
  Meters,
  Outcome,
  RangeBand,
  RollResult,
  Season,
  SkirmishFoe,
  SkirmishMove,
  Trait,
  Weather,
} from "@/lib/game/types";
import { DAYS_PER_SEASON, DAYS_PER_YEAR, METER_MAX } from "@/lib/game/types";

function clamp(n: number, min = 0, max = METER_MAX) {
  return Math.max(min, Math.min(max, n));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function nextSeed(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function seasonFromDay(dayOfYear: number): Season {
  const d = ((dayOfYear % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
  if (d < DAYS_PER_SEASON) return "spring";
  if (d < DAYS_PER_SEASON * 2) return "summer";
  if (d < DAYS_PER_SEASON * 3) return "fall";
  return "winter";
}

export function seasonLabel(season: Season): string {
  return {
    spring: "Late spring thaw",
    summer: "High summer",
    fall: "Fall hunt",
    winter: "Deep winter",
  }[season];
}

export function weatherLabel(weather: Weather): string {
  return {
    clear: "Clear",
    wind: "Hard wind",
    snow: "Snow",
    blizzard: "Blizzard",
    storm: "Summer storm",
  }[weather];
}

export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

export function dateLabel(state: GameState): string {
  const dayInSeason = (state.dayOfYear % DAYS_PER_SEASON) + 1;
  return `Year ${state.year + 1}, ${seasonLabel(state.season)}, day ${dayInSeason}`;
}

function pickWeather(season: Season, rng: () => number): Weather {
  const table: Record<Season, Weather[]> = {
    spring: ["clear", "clear", "wind", "snow", "storm", "wind"],
    summer: ["clear", "clear", "clear", "wind", "storm", "storm"],
    fall: ["clear", "wind", "wind", "snow", "clear", "snow"],
    winter: ["snow", "snow", "wind", "blizzard", "clear", "blizzard"],
  };
  const opts = table[season];
  return opts[Math.floor(rng() * opts.length)]!;
}

function drainForHour(state: GameState): Partial<Meters> {
  const night = state.hour < 6 || state.hour >= 20;
  const winter = state.season === "winter";
  const coat = state.inventory.coat ? 1 : 0;
  let warmth = 2;
  if (state.weather === "wind") warmth += 3;
  if (state.weather === "snow") warmth += 4;
  if (state.weather === "blizzard") warmth += 8;
  if (state.weather === "storm") warmth += 2;
  if (winter) warmth += 3;
  if (night) warmth += 2;
  if (coat) warmth -= 2;
  if (state.campfire) warmth -= 6;
  const loc = LOCATION_BY_ID[state.locationId];
  if (loc?.tags.includes("shelter")) warmth -= 2;
  return {
    hunger: 1,
    thirst: 2,
    energy: night ? 1 : 2,
    warmth: Math.max(0, warmth),
  };
}

function applyMeterDelta(meters: Meters, delta: Partial<Meters>, invertDrain = false) {
  const sign = invertDrain ? -1 : 1;
  (Object.keys(delta) as (keyof Meters)[]).forEach((k) => {
    const amt = delta[k];
    if (amt == null) return;
    meters[k] = clamp(meters[k] + amt * sign);
  });
}

function decayHealth(meters: Meters) {
  let bite = 0;
  // Fastest killers win the name if several meters are already gone.
  let cause: DeathCause | null = null;
  if (meters.energy <= 0) {
    bite += 4;
    cause = "exhaustion";
  }
  if (meters.hunger <= 0) {
    bite += 6;
    cause = "starvation";
  }
  if (meters.warmth <= 0) {
    bite += 8;
    cause = "exposure";
  }
  if (meters.thirst <= 0) {
    bite += 8;
    cause = "thirst";
  }
  if (bite) meters.health = clamp(meters.health - bite);
  return cause;
}

function appendLog(state: GameState, text: string, roll?: RollResult): GameState {
  const entry: LogEntry = {
    id: `${state.rngSeed}-${state.log.length}`,
    text,
    roll,
  };
  return { ...state, log: [...state.log.slice(-14), entry] };
}

function rollPenalty(state: GameState): number {
  let p = 0;
  if (state.meters.hunger < 25) p += 1;
  if (state.meters.thirst < 25) p += 1;
  if (state.meters.warmth < 25) p += 2;
  if (state.meters.energy < 25) p += 1;
  if (state.meters.health < 30) p += 1;
  return p;
}

export function rollCheck(
  state: GameState,
  trait: Trait,
  dc: number,
): { state: GameState; roll: RollResult } {
  const rng = mulberry32(state.rngSeed);
  const d20 = 1 + Math.floor(rng() * 20);
  const modifier = state.traits[trait];
  const penalty = rollPenalty(state);
  const total = d20 + modifier - penalty;
  const roll: RollResult = {
    d20,
    trait,
    modifier,
    penalty,
    dc,
    total,
    success: total >= dc || d20 === 20,
  };
  if (d20 === 1) roll.success = false;
  return { state: { ...state, rngSeed: nextSeed(state.rngSeed) }, roll };
}

function inventoryCost(outcome: Outcome | undefined) {
  const cost: Partial<Record<"rations" | "water" | "firewood" | "pelts" | "powder", number>> = {};
  if (!outcome?.inventory) return cost;
  for (const [k, v] of Object.entries(outcome.inventory)) {
    if (v == null || v >= 0) continue;
    const key = k as "rations" | "water" | "firewood" | "pelts" | "powder";
    cost[key] = -v;
  }
  return cost;
}

function canAfford(state: GameState, outcome: Outcome | undefined): boolean {
  if (!outcome) return true;
  const cost = inventoryCost(outcome);
  for (const [k, need] of Object.entries(cost)) {
    if (need == null) continue;
    const have = state.inventory[k as keyof typeof cost];
    if ((have ?? 0) < need) return false;
  }
  return true;
}

function choiceAffordable(state: GameState, option: EncounterChoice): boolean {
  if (option.outcome) return canAfford(state, option.outcome);
  // Checks: only block if every branch would spend more than you have.
  if (option.check) {
    const successOk = !option.success || canAfford(state, option.success);
    const failOk = !option.fail || canAfford(state, option.fail);
    return successOk || failOk;
  }
  return true;
}

function applyOutcome(state: GameState, outcome: Outcome): GameState {
  if (!canAfford(state, outcome)) {
    return appendLog(
      { ...state, activeEncounterId: null },
      "You do not have what that would cost. The moment passes.",
    );
  }

  let next = { ...state };
  next.meters = { ...next.meters };
  next.inventory = { ...next.inventory, extras: [...next.inventory.extras] };
  next.standing = { ...next.standing };
  next.knownLocations = [...next.knownLocations];
  next.seenDialogueIds = [...next.seenDialogueIds];

  if (outcome.meters) applyMeterDelta(next.meters, outcome.meters);
  if (outcome.inventory) {
    for (const [k, v] of Object.entries(outcome.inventory)) {
      if (v == null) continue;
      const key = k as keyof typeof outcome.inventory;
      next.inventory[key] = Math.max(0, (next.inventory[key] as number) + v);
    }
  }
  if (outcome.extraAdd && !next.inventory.extras.includes(outcome.extraAdd)) {
    next.inventory.extras.push(outcome.extraAdd);
    if (outcome.extraAdd === "dead-mans-coat") next.inventory.coat = true;
  }
  if (outcome.extraRemove) {
    next.inventory.extras = next.inventory.extras.filter((e) => e !== outcome.extraRemove);
  }
  if (outcome.standing) {
    const id = outcome.standing.id;
    next.standing[id] = (next.standing[id] ?? 0) + outcome.standing.delta;
  }
  if (outcome.unlockLocation && !next.knownLocations.includes(outcome.unlockLocation)) {
    next.knownLocations.push(outcome.unlockLocation);
  }
  if (outcome.presentCharacter !== undefined) {
    next.presentCharacterId = outcome.presentCharacter;
  }
  if (outcome.markDialogue && !next.seenDialogueIds.includes(outcome.markDialogue)) {
    next.seenDialogueIds.push(outcome.markDialogue);
  }
  if (outcome.hours) next = advanceTime(next, outcome.hours);
  if (outcome.startSkirmish && !next.dead) {
    next.skirmish = {
      ...outcome.startSkirmish,
      foes: outcome.startSkirmish.foes.map((f) => ({ ...f })),
      playerCover: false,
      awaiting: "player",
    };
    next.activeEncounterId = null;
  }
  next = appendLog(next, outcome.text);
  if (outcome.death && !next.dead) {
    next.dead = {
      cause: outcome.death.cause,
      detail: outcome.death.detail,
      daysSurvived: next.daysSurvived,
      season: next.season,
    };
  }
  next = finalizeHealth(next, !outcome.hours);
  return next;
}

function inferCause(meters: Meters): DeathCause | null {
  if (meters.thirst <= 0) return "thirst";
  if (meters.warmth <= 0) return "exposure";
  if (meters.hunger <= 0) return "starvation";
  if (meters.energy <= 0) return "exhaustion";
  return null;
}

function finalizeHealth(state: GameState, bite = true): GameState {
  if (state.dead) return state;
  const meters = { ...state.meters };
  const cause = bite ? decayHealth(meters) : inferCause(meters);
  if (meters.health <= 0) {
    const named = cause ?? "sickness";
    return {
      ...state,
      meters,
      dead: {
        cause: named,
        detail: deathCopy(named),
        daysSurvived: state.daysSurvived,
        season: state.season,
      },
    };
  }
  return { ...state, meters };
}

function deathCopy(cause: DeathCause): string {
  switch (cause) {
    case "starvation":
      return "You went hollow. The last thing you tasted was pine smoke and want.";
    case "thirst":
      return "Your tongue cracked. The creek was a rumor you could no longer reach.";
    case "exposure":
      return "The cold finished the work it started the first night you slept without a fire.";
    case "exhaustion":
      return "You sat down to rest and the mountain accepted the offering.";
    case "violence":
      return "Someone — or something — was quicker.";
    case "accident":
      return "Ice, rock, or bad luck. The mountain does not file reports.";
    case "sickness":
      return "Fever took the hours you needed to keep walking.";
  }
}

function fireHoursLeft(state: GameState): number {
  if (state.campfireHours != null) return state.campfireHours;
  return state.campfire ? 6 : 0;
}

export function advanceTime(state: GameState, hours: number): GameState {
  if (hours <= 0) return state;
  let next = { ...state, meters: { ...state.meters } };
  let burning = fireHoursLeft(next);
  if (burning > 0) next.campfire = true;
  for (let i = 0; i < hours; i++) {
    if (next.dead) break;
    applyMeterDelta(next.meters, drainForHour(next), true);
    next.hour += 1;
    if (next.hour >= 24) {
      next.hour = 0;
      next.dayOfYear += 1;
      next.daysSurvived += 1;
      if (next.dayOfYear >= DAYS_PER_YEAR) {
        next.dayOfYear = 0;
        next.year += 1;
      }
      next.season = seasonFromDay(next.dayOfYear);
      const rng = mulberry32(next.rngSeed + next.daysSurvived);
      // A blizzard that dies at midnight is a rumor. Winter storms often last the night.
      const stayStorm =
        next.weather === "blizzard" && next.season === "winter" && rng() < 0.62;
      if (!stayStorm) next.weather = pickWeather(next.season, rng);
      next.rngSeed = nextSeed(next.rngSeed);
      if (next.weather === "blizzard") {
        next.campfire = false;
        burning = 0;
      }
    }
    if (next.hour === 12 && next.weather !== "blizzard") {
      const rng = mulberry32(next.rngSeed + next.hour);
      if (rng() < 0.22) next.weather = pickWeather(next.season, rng);
      next.rngSeed = nextSeed(next.rngSeed);
    }
    if (next.campfire) {
      burning -= 1;
      if (burning <= 0) {
        next.campfire = false;
        burning = 0;
      }
    }
    next.campfireHours = burning;
    next = finalizeHealth(next, true);
  }
  return next;
}

function matchesEncounter(enc: EncounterDef, state: GameState): boolean {
  if (state.seenEncounterIds.includes(enc.id)) return false;
  if (enc.season) {
    const seasons = Array.isArray(enc.season) ? enc.season : [enc.season];
    if (!seasons.includes(state.season)) return false;
  }
  if (enc.locations && enc.locations !== "any") {
    if (!enc.locations.includes(state.locationId)) return false;
  }
  if (enc.weather && !enc.weather.includes(state.weather)) return false;
  if (enc.characterId && enc.characterId !== state.presentCharacterId) return false;
  return true;
}

function pickEncounter(state: GameState, kind: "search" | "arrive" | "wait"): EncounterDef {
  const pool = allEncounters().filter((e) => matchesEncounter(e, state));
  if (pool.length === 0) return choreEncounter(state, kind);
  const rng = mulberry32(state.rngSeed + kind.length * 17);
  // Place-bound beats before generic "any" oneshots, so a location still has a story.
  const weights = pool.map((e) => e.weight ?? (e.locations === "any" || !e.locations ? 1 : 2));
  const total = weights.reduce((a, b) => a + b, 0);
  let n = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    n -= weights[i]!;
    if (n <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function isUniqueStory(enc: EncounterDef) {
  return !enc.id.startsWith("chore-") && !enc.id.startsWith("dlg-");
}

function beginEncounter(state: GameState, enc: EncounterDef): GameState {
  const mark = isUniqueStory(enc);
  const seen =
    !mark || state.seenEncounterIds.includes(enc.id)
      ? state.seenEncounterIds
      : [...state.seenEncounterIds, enc.id];
  let next: GameState = {
    ...state,
    seenEncounterIds: seen,
    activeEncounterId: enc.id,
    rngSeed: nextSeed(state.rngSeed),
  };
  if (enc.characterId) next.presentCharacterId = enc.characterId;
  next = appendLog(next, enc.text);
  return next;
}

function getActiveEncounter(state: GameState): EncounterDef | undefined {
  const id = state.activeEncounterId;
  if (!id) return undefined;
  const fromBook = allEncounters().find((e) => e.id === id);
  if (fromBook) return fromBook;
  if (id.startsWith("dlg-")) return findDialogueEncounter(state);
  if (id.startsWith("chore-")) return choreEncounter(state, choreKindFromId(id));
  return undefined;
}

function presentPeople(state: GameState) {
  return CHARACTERS.filter((c) => {
    if (!c.home.includes(state.locationId)) return false;
    if (c.seasons !== "all" && !c.seasons.includes(state.season)) return false;
    return true;
  });
}

function maybePresentCharacter(state: GameState): GameState {
  const people = presentPeople(state);
  if (people.length === 0) return { ...state, presentCharacterId: null };
  const rng = mulberry32(state.rngSeed + 99);
  if (rng() < 0.45) {
    const pick = people[Math.floor(rng() * people.length)]!;
    return { ...state, presentCharacterId: pick.id, rngSeed: nextSeed(state.rngSeed) };
  }
  return { ...state, presentCharacterId: null, rngSeed: nextSeed(state.rngSeed) };
}

export function createGame(name: string, kit: Kit): GameState {
  const traits = { eye: 1, grit: 1, savvy: 1, hands: 1 };
  const inventory = {
    rations: 4,
    water: 3,
    firewood: 2,
    pelts: 0,
    powder: 2,
    knife: true,
    rifle: true,
    coat: false,
    extras: [] as string[],
  };
  const meters: Meters = {
    hunger: 62,
    thirst: 64,
    warmth: 52,
    energy: 58,
    health: 82,
  };
  if (kit === "rations") {
    inventory.rations += 4;
    traits.grit += 1;
  } else if (kit === "powder") {
    inventory.powder += 4;
    traits.eye += 1;
  } else {
    inventory.coat = true;
    meters.warmth = 70;
    traits.grit += 1;
  }
  const dayOfYear = 8;
  const seed = (Date.now() ^ (name.length * 7919)) >>> 0;
  const season = seasonFromDay(dayOfYear);
  const state: GameState = {
    name: name.trim() || "Trapper",
    kit,
    dayOfYear,
    hour: 7,
    daysSurvived: 0,
    year: 0,
    season,
    weather: "wind",
    locationId: "high-camp",
    knownLocations: ["high-camp", "creek", "timberline"],
    meters,
    inventory,
    traits,
    standing: {},
    seenEncounterIds: [],
    seenDialogueIds: [],
    presentCharacterId: null,
    activeEncounterId: null,
    log: [],
    skirmish: null,
    campfire: false,
    campfireHours: 0,
    dead: null,
    rngSeed: seed,
  };
  return appendLog(
    state,
    `${state.name} wakes in a lean-to that leaked all night. Late spring, 1835, too high on the Front Range. The pass is still a white lie. There is no town coming. Eat. Drink. Keep a fire. Do not die.`,
  );
}

function resolveEncounterChoice(state: GameState, optionId: string): GameState {
  const enc = getActiveEncounter(state);
  if (!enc) return { ...state, activeEncounterId: null };
  const option = enc.choices.find((c) => c.id === optionId);
  if (!option) return { ...state, activeEncounterId: null };
  return resolveChoice(state, option, true);
}

function resolveChoice(state: GameState, option: EncounterChoice, closeEncounter: boolean): GameState {
  let next = closeEncounter ? { ...state, activeEncounterId: null } : state;
  if (option.check) {
    const rolled = rollCheck(next, option.check.trait, option.check.dc);
    next = rolled.state;
    const branch = rolled.roll.success ? option.success : option.fail;
    const rollLine = `d20 ${rolled.roll.d20} + ${rolled.roll.trait} ${rolled.roll.modifier} − weariness ${rolled.roll.penalty} = ${rolled.roll.total} vs DC ${rolled.roll.dc} — ${rolled.roll.success ? "success" : "fail"}.`;
    next = appendLog(next, rollLine, rolled.roll);
    if (branch) next = applyOutcome(next, branch);
    return next;
  }
  if (option.outcome) next = applyOutcome(next, option.outcome);
  return next;
}

function talk(state: GameState): GameState {
  const id = state.presentCharacterId;
  if (!id) {
    return appendLog({ ...state, hour: state.hour }, "No one is here who will answer you.");
  }
  const person = CHARACTER_BY_ID[id];
  if (!person) return state;
  const node = person.nodes.find((n) => {
    if (state.seenDialogueIds.includes(n.id)) return false;
    if (n.seasons && !n.seasons.includes(state.season)) return false;
    if (n.minStanding != null && (state.standing[id] ?? 0) < n.minStanding) return false;
    if (n.requiresExtra && !state.inventory.extras.includes(n.requiresExtra)) return false;
    if (n.unlessExtra && state.inventory.extras.includes(n.unlessExtra)) return false;
    return true;
  });
  if (!node) {
    return appendLog(advanceTime(state, 1), person.fallback);
  }
  const fake: EncounterDef = {
    id: `dlg-${node.id}`,
    text: node.text,
    choices: node.choices,
  };
  return beginEncounter({ ...state, presentCharacterId: id }, fake);
}

function travel(state: GameState, to: LocationId): GameState {
  const loc = LOCATION_BY_ID[state.locationId];
  const edge = loc?.connections.find((c) => c.to === to);
  if (!edge) return appendLog(state, "There is no trail that way from here.");
  let hours = edge.hours;
  if (state.weather === "snow") hours += 1;
  if (state.weather === "blizzard") hours += 2;
  if (state.season === "winter") hours += 1;
  if (state.hour < 6 || state.hour >= 20) hours += 1;
  if (
    state.inventory.extras.includes("snowshoes") &&
    (state.season === "winter" || state.weather === "snow" || state.weather === "blizzard")
  ) {
    hours = Math.max(edge.hours, hours - 1);
  }
  let next: GameState = {
    ...state,
    campfire: false,
    campfireHours: 0,
    presentCharacterId: null,
    activeEncounterId: null,
  };
  next = advanceTime(next, hours);
  if (next.dead) {
    return appendLog(next, `You try for ${LOCATION_BY_ID[to]?.name ?? to}. The trail takes more than you have.`);
  }
  next.locationId = to;
  if (!next.knownLocations.includes(to)) next.knownLocations = [...next.knownLocations, to];
  next = maybePresentCharacter(next);
  const dest = LOCATION_BY_ID[to];
  next = appendLog(
    next,
    `You take ${edge.trailName} and come into ${dest?.name ?? to}. ${dest?.blurb ?? ""}`,
  );
  const fallRng = mulberry32(next.rngSeed);
  next = { ...next, rngSeed: nextSeed(next.rngSeed) };
  if (next.weather === "blizzard" && fallRng() < 0.15) {
    return applyOutcome(next, {
      text: "In the white, the ground drops. You find it with your ribs.",
      meters: { health: -14, energy: -10 },
      hours: 1,
    });
  }
  const enc = pickEncounter(next, "arrive");
  if (isUniqueStory(enc) && mulberry32(next.rngSeed)() < 0.72) {
    return beginEncounter(next, enc);
  }
  return next;
}

function sleep(state: GameState): GameState {
  const loc = LOCATION_BY_ID[state.locationId];
  const shelter = loc?.tags.includes("shelter") || state.locationId === "high-camp";
  const fire = state.campfire;
  const hours = 8;
  let next = advanceTime(state, hours);
  if (next.dead) {
    return appendLog(next, "You lie down. The mountain does the rest.");
  }
  next.meters = { ...next.meters };
  next.meters.energy = clamp(next.meters.energy + (fire || shelter ? 55 : 25));
  if (fire || shelter) next.meters.warmth = clamp(next.meters.warmth + 20);
  else next.meters.warmth = clamp(next.meters.warmth - 10);
  if (state.weather === "blizzard" && !shelter && !fire) {
    next.meters.warmth = clamp(next.meters.warmth - 25);
    next.meters.health = clamp(next.meters.health - 8);
  }
  const stillBurning = fire && shelter && fireHoursLeft(next) > 0;
  next.campfire = stillBurning;
  if (!stillBurning) next.campfireHours = 0;
  next.presentCharacterId = null;
  next.activeEncounterId = null;
  next = appendLog(
    next,
    fire || shelter
      ? "You sleep in what passes for safety. Dawn is not kinder, only later."
      : "You sleep in the open. The stars are very clear. That is not a comfort.",
  );
  return finalizeHealth(next, true);
}

function rangeStep(range: RangeBand, dir: -1 | 1): RangeBand {
  const order: RangeBand[] = ["far", "near", "close"];
  const i = Math.max(0, Math.min(2, order.indexOf(range) + dir));
  return order[i]!;
}

function foeDamage(foe: SkirmishFoe, cover: boolean, rng: () => number) {
  const [lo, hi] = foe.damage;
  let dmg = lo + Math.floor(rng() * (hi - lo + 1));
  if (cover) dmg = Math.max(1, Math.floor(dmg / 2));
  if (foe.range === "far") dmg = Math.max(0, dmg - 3);
  return dmg;
}

function endSkirmish(state: GameState, text: string, fled = false): GameState {
  let next: GameState = { ...state, skirmish: null };
  next = advanceTime(next, 1);
  next.campfire = false;
  if (fled) next.presentCharacterId = null;
  return appendLog(next, text);
}

function resolveSkirmish(state: GameState, move: SkirmishMove): GameState {
  if (!state.skirmish) return state;
  let next: GameState = { ...state, skirmish: { ...state.skirmish, foes: state.skirmish.foes.map((f) => ({ ...f })) } };
  const sk = next.skirmish!;
  const rng = mulberry32(next.rngSeed);
  next.rngSeed = nextSeed(next.rngSeed);

  if (move === "flee") {
    const rolled = rollCheck(next, "grit", 12);
    next = rolled.state;
    next = appendLog(
      next,
      `Flee — d20 ${rolled.roll.d20} + grit ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs 12.`,
      rolled.roll,
    );
    if (rolled.roll.success) return endSkirmish(next, "You break contact and do not look back.", true);
    next = appendLog(next, "You cannot get clear. They stay with you.");
  } else if (move === "cover") {
    sk.playerCover = true;
    next = appendLog(next, "You put rock and timber between you and whatever wants you dead.");
  } else if (move === "item") {
    if (next.inventory.rations > 0 && next.meters.health < 70) {
      next.inventory = { ...next.inventory, rations: next.inventory.rations - 1 };
      next.meters = { ...next.meters, health: clamp(next.meters.health + 8), hunger: clamp(next.meters.hunger + 10) };
      next = appendLog(next, "You choke down a ration with shaking hands. It is not medicine. It is enough to stay up.");
    } else if (next.inventory.water > 0) {
      next.inventory = { ...next.inventory, water: next.inventory.water - 1 };
      next.meters = { ...next.meters, thirst: clamp(next.meters.thirst + 20), energy: clamp(next.meters.energy + 4) };
      next = appendLog(next, "A swallow of water. The world steadies a hair.");
    } else {
      next = appendLog(next, "Your hands find nothing useful.");
    }
  } else if (move === "close") {
    const target = sk.foes.find((f) => f.hp > 0);
    if (target) {
      if (target.range !== "close") {
        target.range = rangeStep(target.range, 1);
        next = appendLog(next, `You close on ${target.name}. Now ${target.range}.`);
      } else {
        const rolled = rollCheck(next, "hands", 11);
        next = rolled.state;
        next = appendLog(
          next,
          `Knife — d20 ${rolled.roll.d20} + hands ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs 11.`,
          rolled.roll,
        );
        if (rolled.roll.success) {
          const edge = next.inventory.extras.includes("true-edge") ? 2 : 0;
          const dmg = 4 + edge + Math.floor(mulberry32(next.rngSeed)() * 6);
          target.hp = Math.max(0, target.hp - dmg);
          next.rngSeed = nextSeed(next.rngSeed);
          next = appendLog(next, `The knife finds ${target.name} (${dmg}).`);
        } else {
          next = appendLog(next, "You slash air and wool.");
        }
      }
    }
  } else if (move === "fire") {
    if (!next.inventory.rifle || next.inventory.powder <= 0) {
      next = appendLog(next, "No powder. The rifle is furniture.");
    } else {
      const target = sk.foes.find((f) => f.hp > 0);
      if (target) {
        const dc = target.range === "far" ? 14 : target.range === "near" ? 12 : 10;
        next.inventory = { ...next.inventory, powder: next.inventory.powder - 1 };
        const rolled = rollCheck(next, "eye", dc);
        next = rolled.state;
        next = appendLog(
          next,
          `Rifle — d20 ${rolled.roll.d20} + eye ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs ${dc}. Powder left: ${next.inventory.powder}.`,
          rolled.roll,
        );
        if (rolled.roll.success) {
          const dmg = 8 + Math.floor(mulberry32(next.rngSeed)() * 9);
          target.hp = Math.max(0, target.hp - dmg);
          next.rngSeed = nextSeed(next.rngSeed);
          next = appendLog(next, `${target.name} takes the ball (${dmg}).`);
        } else {
          next = appendLog(next, "The shot goes wide and the mountain swallows the sound.");
        }
      }
    }
  }

  if (sk.allyName && sk.foes.some((f) => f.hp > 0)) {
    const t = sk.foes.find((f) => f.hp > 0);
    if (t && rng() < 0.55) {
      const dmg = 3 + Math.floor(rng() * 5);
      t.hp = Math.max(0, t.hp - dmg);
      next = appendLog(next, `${sk.allyName} hits ${t.name} (${dmg}).`);
    }
  }

  if (sk.foes.every((f) => f.hp <= 0)) {
    return endSkirmish(next, "It is over. Your hands do not know that yet.");
  }

  for (const foe of sk.foes) {
    if (foe.hp <= 0) continue;
    if (foe.range !== "close" && rng() < 0.6) {
      foe.range = rangeStep(foe.range, 1);
      next = appendLog(next, `${foe.name} closes — now ${foe.range}.`);
      continue;
    }
    const dc = 10 + (sk.playerCover ? 3 : 0);
    const d20 = 1 + Math.floor(rng() * 20);
    if (d20 + 2 >= dc) {
      const dmg = foeDamage(foe, sk.playerCover, rng);
      next.meters = { ...next.meters, health: clamp(next.meters.health - dmg) };
      next = appendLog(next, `${foe.name} hits you (${dmg}).`);
    } else {
      next = appendLog(next, `${foe.name} misses.`);
    }
  }

  sk.playerCover = move === "cover";
  next = finalizeHealth(next);
  if (next.dead) {
    next.dead = {
      cause: "violence",
      detail: deathCopy("violence"),
      daysSurvived: next.daysSurvived,
      season: next.season,
    };
    next.skirmish = null;
  }
  return next;
}

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.dead) return state;
  if (state.skirmish && action.type !== "skirmish") return state;
  if (state.activeEncounterId && action.type !== "encounterChoice" && action.type !== "skirmish") {
    if (getActiveEncounter(state)) return state;
    state = { ...state, activeEncounterId: null };
  }

  switch (action.type) {
    case "eat": {
      if (state.inventory.rations <= 0) return appendLog(state, "The bag is empty. Your stomach is not.");
      const next = {
        ...state,
        inventory: { ...state.inventory, rations: state.inventory.rations - 1 },
        meters: { ...state.meters, hunger: clamp(state.meters.hunger + 40) },
      };
      const eats = [
        "You eat. It is not a meal. It is a postponement.",
        "Flour, grease, the idea of salt. You chew until the hour agrees to continue.",
        "You eat standing, like a man who does not trust chairs.",
      ];
      return appendLog(advanceTime(next, 1), eats[state.daysSurvived % eats.length]!);
    }
    case "drink": {
      if (state.inventory.water <= 0) return appendLog(state, "The canteen talks like a drum.");
      const next = {
        ...state,
        inventory: { ...state.inventory, water: state.inventory.water - 1 },
        meters: { ...state.meters, thirst: clamp(state.meters.thirst + 48) },
      };
      const drinks = [
        "You drink. For a minute the world is simple.",
        "The canteen lightens. Your tongue remembers it is a tool.",
        "A swallow, then another. Thirst files a later complaint.",
      ];
      return appendLog(advanceTime(next, 1), drinks[(state.daysSurvived + state.hour) % drinks.length]!);
    }
    case "sleep":
      return sleep(state);
    case "makeFire": {
      if (state.inventory.firewood <= 0) return appendLog(state, "No wood. Rubbing your hands is not a fire.");
      const fatwood = state.inventory.extras.includes("fatwood");
      if (state.weather === "blizzard" && !fatwood) {
        return appendLog(state, "The blizzard eats the first spark and wants the rest.");
      }
      let next: GameState = {
        ...state,
        inventory: { ...state.inventory, firewood: state.inventory.firewood - 1 },
        campfire: true,
        campfireHours:
          (state.weather === "blizzard" ? 4 : 10) + (state.inventory.extras.includes("fire-drill") ? 2 : 0),
        meters: { ...state.meters, warmth: clamp(state.meters.warmth + (fatwood ? 38 : 28)) },
      };
      if (state.weather === "blizzard" && fatwood) {
        next.inventory.extras = next.inventory.extras.filter((e) => e !== "fatwood");
        next = appendLog(advanceTime(next, 1), "Pitch light, mean and holy. The blizzard does not care. You do.");
        return next;
      }
      return appendLog(advanceTime(next, 1), "The fire takes. You remember you have a face.");
    }
    case "gatherWater": {
      const loc = LOCATION_BY_ID[state.locationId];
      if (!loc?.tags.includes("water") && state.locationId !== "hot-spring" && state.locationId !== "creek") {
        return appendLog(state, "No water here that you would trust.");
      }
      const winterIce = state.season === "winter" || state.weather === "snow" || state.weather === "blizzard";
      if (winterIce) {
        const rolled = rollCheck(state, "hands", 12);
        let next = appendLog(
          rolled.state,
          `Ice — d20 ${rolled.roll.d20} + hands ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs 12.`,
          rolled.roll,
        );
        if (!rolled.roll.success) {
          next.meters = { ...next.meters, health: clamp(next.meters.health - 6), warmth: clamp(next.meters.warmth - 12) };
          next = appendLog(advanceTime(next, 2), "The ice opens a mouth. You get out. Not all of the heat comes with you.");
          return next;
        }
        next.inventory = { ...next.inventory, water: next.inventory.water + 2 };
        return appendLog(advanceTime(next, 2), "You take water from ice like a thief. Two canteens.");
      }
      const next = {
        ...state,
        inventory: { ...state.inventory, water: state.inventory.water + 2 },
      };
      return appendLog(advanceTime(next, 1), "You fill the canteens. The water tastes of granite and luck.");
    }
    case "gatherWood": {
      const loc = LOCATION_BY_ID[state.locationId];
      if (!loc?.tags.includes("wood")) return appendLog(state, "This ground does not owe you timber.");
      if (state.season === "winter" || state.weather === "blizzard") {
        const rolled = rollCheck(state, "hands", 12);
        let next = appendLog(
          rolled.state,
          `Deadwood — d20 ${rolled.roll.d20} + hands ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs 12.`,
          rolled.roll,
        );
        const gain = rolled.roll.success ? 2 : 1;
        next.inventory = { ...next.inventory, firewood: next.inventory.firewood + gain };
        return appendLog(
          advanceTime(next, 2),
          rolled.roll.success
            ? "You break frozen limbs until your shoulders argue. Two armfuls, paid in skin."
            : "Snow up to the elbow. One armful and a hatred of January.",
        );
      }
      const next = {
        ...state,
        inventory: { ...state.inventory, firewood: state.inventory.firewood + 2 },
      };
      return appendLog(advanceTime(next, 2), "You break dead limbs until your shoulders argue. Two armfuls.");
    }
    case "wait": {
      let next = advanceTime(state, 3);
      if (next.dead) return appendLog(next, "You wait. The weather finishes the sentence.");
      const enc = pickEncounter(next, "wait");
      if (isUniqueStory(enc)) return beginEncounter(next, enc);
      return appendLog(next, waitFlavor(next));
    }
    case "search": {
      let next = advanceTime(state, 2);
      if (next.dead) return appendLog(next, "You search until the ground is the last thing that holds you.");
      const enc = pickEncounter(next, "search");
      if (isUniqueStory(enc)) return beginEncounter(next, enc);
      return applyOutcome(next, forageOutcome(next));
    }
    case "talk":
      return talk(state);
    case "travel":
      return travel(state, action.to);
    case "encounterChoice":
      return resolveEncounterChoice(state, action.optionId);
    case "skirmish":
      return resolveSkirmish(state, action.move);
  }
}

export function getChoices(state: GameState): Choice[] {
  if (state.dead) return [];
  if (state.skirmish) {
    return [
      { id: "fire", label: "Aim / fire", hint: "Eye, costs powder", action: { type: "skirmish", move: "fire" } },
      { id: "close", label: "Close / knife", hint: "Hands", action: { type: "skirmish", move: "close" } },
      { id: "cover", label: "Take cover", action: { type: "skirmish", move: "cover" } },
      { id: "item", label: "Use ration or water", action: { type: "skirmish", move: "item" } },
      { id: "flee", label: "Flee", hint: "Grit", action: { type: "skirmish", move: "flee" } },
    ];
  }
  if (state.activeEncounterId) {
    const enc = getActiveEncounter(state);
    if (!enc) return campChoices(state);
    return enc.choices.map((c) => {
      const afford = choiceAffordable(state, c);
      const cost = inventoryCost(c.outcome ?? c.success);
      const costHint =
        !afford && Object.keys(cost).length
          ? `Need ${Object.entries(cost)
              .map(([k, v]) => `${v} ${k}`)
              .join(", ")}`
          : undefined;
      return {
        id: c.id,
        label: c.label,
        disabled: !afford,
        hint: c.check ? `d20 + ${c.check.trait} vs ${c.check.dc}` : costHint,
        action: { type: "encounterChoice" as const, optionId: c.id },
      };
    });
  }
  return campChoices(state);
}

function findDialogueEncounter(state: GameState): EncounterDef | undefined {
  const id = state.presentCharacterId;
  if (!id) return undefined;
  const person = CHARACTER_BY_ID[id];
  if (!person) return undefined;
  const nodeId = state.activeEncounterId?.replace(/^dlg-/, "");
  const node = person.nodes.find((n) => n.id === nodeId);
  if (!node) return undefined;
  return { id: `dlg-${node.id}`, text: node.text, choices: node.choices };
}

function campChoices(state: GameState): Choice[] {
  const loc = LOCATION_BY_ID[state.locationId];
  const choices: Choice[] = [
    {
      id: "eat",
      label: "Eat",
      disabled: state.inventory.rations <= 0,
      hint: state.inventory.rations <= 0 ? "No rations" : `${state.inventory.rations} left`,
      action: { type: "eat" },
    },
    {
      id: "drink",
      label: "Drink",
      disabled: state.inventory.water <= 0,
      hint: state.inventory.water <= 0 ? "Canteen empty" : `${state.inventory.water} left`,
      action: { type: "drink" },
    },
    { id: "sleep", label: "Sleep", action: { type: "sleep" } },
    {
      id: "fire",
      label: "Make a fire",
      disabled:
        state.inventory.firewood <= 0 ||
        state.campfire ||
        (state.weather === "blizzard" && !state.inventory.extras.includes("fatwood")),
      hint: state.campfire
        ? "Already burning"
        : state.weather === "blizzard" && state.inventory.extras.includes("fatwood")
          ? "Fatwood against the blizzard"
          : undefined,
      action: { type: "makeFire" },
    },
    { id: "search", label: "Search this ground", action: { type: "search" } },
    { id: "wait", label: "Wait out the weather", action: { type: "wait" } },
  ];
  if (loc?.tags.includes("water")) {
    choices.push({ id: "water", label: "Take water", action: { type: "gatherWater" } });
  }
  if (loc?.tags.includes("wood")) {
    choices.push({ id: "wood", label: "Gather wood", action: { type: "gatherWood" } });
  }
  if (state.presentCharacterId) {
    const p = CHARACTER_BY_ID[state.presentCharacterId];
    choices.unshift({
      id: "talk",
      label: p ? `Talk to ${p.name}` : "Talk",
      action: { type: "talk" },
    });
  }
  for (const edge of loc?.connections ?? []) {
    const dest = LOCATION_BY_ID[edge.to];
    const known = state.knownLocations.includes(edge.to);
    choices.push({
      id: `go-${edge.to}`,
      label: known ? `Travel to ${dest?.name ?? edge.to}` : `Take ${edge.trailName}`,
      hint: `${edge.hours}+ hours`,
      action: { type: "travel", to: edge.to },
    });
  }
  return choices;
}

export function locationName(id: LocationId) {
  return LOCATION_BY_ID[id]?.name ?? id;
}

export function characterName(id: CharacterId) {
  return CHARACTER_BY_ID[id]?.name ?? id;
}

export function artFor(state: GameState): { location: string; portrait: string | null; atmosphere: string } {
  const loc = LOCATION_BY_ID[state.locationId];
  const person = state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : undefined;
  const atmosphere =
    state.weather === "blizzard"
      ? "/art/atmosphere/blizzard.jpg"
      : state.weather === "storm"
        ? "/art/atmosphere/storm.jpg"
        : `/art/atmosphere/${state.season}.jpg`;
  const portrait = person?.art ?? state.skirmish?.foes[0]?.art ?? null;
  return {
    location: withBase(loc?.art ?? "/art/locations/high-camp.jpg"),
    portrait: portrait ? withBase(portrait) : null,
    atmosphere: withBase(atmosphere),
  };
}
