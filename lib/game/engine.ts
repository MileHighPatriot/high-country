import {
  addCampExtra,
  addToPack,
  atOwnCamp,
  buildHours,
  cacheCap,
  canCook,
  canPitch,
  canStartJob,
  cloneCamp,
  emptyCamp,
  firewoodCap,
  jobHours,
  jobLabel,
  packLeftover,
  packRoom,
  readyJobLine,
  recoverOnStrike,
  spendFromPackOrCache,
  tickCampHour,
  WANDERERS,
} from "@/lib/game/camp";
import {
  cacheCopy,
  campChoices,
  drinkCopy,
  eatCopy,
  fireCopy,
  fishCopy,
  hasShelter,
  huntCopy,
  mendCopy,
  prayCopy,
  restWatchCopy,
  scoutCopy,
  shelterCopy,
  sleepCopy,
  snaresCopy,
  tendCopy,
} from "@/lib/game/content/actions";
import { CHARACTER_BY_ID, CHARACTERS } from "@/lib/game/content/characters";
import { arrivalParagraph, choreEncounter, choreKindFromId, forageOutcome, waitFlavor } from "@/lib/game/content/chores";
import { allEncounters } from "@/lib/game/content/index";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { pickOpening } from "@/lib/game/content/openings";
import { packCap, practiceSkill, skilledDc } from "@/lib/game/progress";
import { deathSentence, JOURNAL_KEEP, trailHours } from "@/lib/game/readout";
import { withBase } from "@/lib/paths";
import type {
  CampJob,
  CampPiece,
  CampStowItem,
  CharacterId,
  Choice,
  DeathCause,
  EncounterChoice,
  EncounterDef,
  EncounterTrigger,
  GameAction,
  GameState,
  Inventory,
  Kit,
  LocationId,
  LogEntry,
  Meters,
  Outcome,
  PendingRoll,
  RangeBand,
  RollResult,
  Season,
  SkirmishFoe,
  SkirmishMove,
  Trait,
  WaitScene,
  Weather,
} from "@/lib/game/types";
import { DAYS_PER_SEASON, DAYS_PER_YEAR, METER_MAX, timeBand } from "@/lib/game/types";

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

/** Hours a wait stance spends. Night is shorter; blizzard and open day sit longer. */
export function waitHours(state: GameState): number {
  if (state.weather === "blizzard") return 4;
  if (timeBand(state.hour) === "night") return 3;
  return 4;
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
  if (loc?.tags.includes("shelter") || (state.camp?.leanTo && atOwnCamp(state))) warmth -= 2;
  if (state.inventory.extras.includes("dry-boots")) warmth -= 3;
  if (state.inventory.extras.includes("snow-hole")) warmth -= 3;
  if (state.inventory.extras.includes("smoked-hide")) warmth -= 2;
  if (atOwnCamp(state) && state.camp?.cache.extras.includes("smoked-hide")) warmth -= 2;
  return {
    hunger: 0.5,
    thirst: 1,
    energy: night ? 0.5 : 1,
    warmth: Math.max(0, Math.round(warmth * 0.6)),
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

function withLeftoverNote(text: string, note: string | null | undefined) {
  return note ? `${text} ${note}` : text;
}

function decayHealth(meters: Meters) {
  let bite = 0;
  // Fastest killers win the name if several meters are already gone.
  let cause: DeathCause | null = null;
  if (meters.energy <= 0) {
    bite += 2;
    cause = "exhaustion";
  }
  if (meters.hunger <= 0) {
    bite += 3;
    cause = "starvation";
  }
  if (meters.warmth <= 0) {
    bite += 4;
    cause = "exposure";
  }
  if (meters.thirst <= 0) {
    bite += 4;
    cause = "thirst";
  }
  if (bite) meters.health = clamp(meters.health - bite);
  return cause;
}

function appendLog(state: GameState, text: string, roll?: RollResult): GameState {
  const entry: LogEntry = {
    id: `${state.daysSurvived}-${state.dayOfYear}-${state.hour}-${state.log.length}-${state.rngSeed}-${roll ? "r" : "s"}`,
    text,
    roll,
    dayOfYear: state.dayOfYear,
    hour: state.hour,
    locationId: state.locationId,
    daysSurvived: state.daysSurvived,
  };
  const log = [...state.log, entry];
  if (state.skirmish) {
    return { ...state, log: log.slice(-8) };
  }
  if (log.length <= JOURNAL_KEEP) return { ...state, log };
  const opening = log[0];
  const rest = log.slice(-(JOURNAL_KEEP - 1));
  if (opening && rest[0]?.id !== opening.id) {
    return { ...state, log: [opening, ...rest] };
  }
  return { ...state, log: rest };
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

export function isDramaticCheck(enc: EncounterDef, option: EncounterChoice): boolean {
  if (!option.check) return false;
  if (enc.intense) return true;
  if (option.check.dc >= 12) return true;
  return Boolean(
    option.success?.death ||
      option.fail?.death ||
      option.success?.startSkirmish ||
      option.fail?.startSkirmish,
  );
}

function makePendingRoll(state: GameState, enc: EncounterDef, option: EncounterChoice): PendingRoll | null {
  if (!option.check) return null;
  return {
    optionId: option.id,
    encounterId: enc.id,
    label: option.label,
    trait: option.check.trait,
    dc: option.check.dc,
    modifier: state.traits[option.check.trait],
    penalty: rollPenalty(state),
  };
}

function armActionDie(
  state: GameState,
  label: string,
  trait: Trait,
  dc: number,
  resume: GameAction,
): { kind: "armed"; state: GameState } | { kind: "rolled"; state: GameState; roll: RollResult } {
  const pending = state.pendingRoll;
  if (pending?.d20 != null && pending.resume?.type === resume.type) {
    const roll = resultFromPending(pending);
    if (roll) return { kind: "rolled", state: { ...state, pendingRoll: null }, roll };
  }
  return {
    kind: "armed",
    state: {
      ...state,
      pendingRoll: {
        optionId: resume.type,
        encounterId: "",
        label,
        trait,
        dc,
        modifier: state.traits[trait],
        penalty: rollPenalty(state),
        resume,
      },
    },
  };
}

function rollLine(roll: RollResult, prefix?: string) {
  const head = prefix ? `${prefix} — ` : "";
  return `${head}d20 ${roll.d20} + ${roll.trait} ${roll.modifier} − weariness ${roll.penalty} = ${roll.total} vs DC ${roll.dc} — ${roll.success ? "success" : "fail"}.`;
}

function resultFromPending(pending: PendingRoll): RollResult | null {
  if (pending.d20 == null) return null;
  const total = pending.total ?? pending.d20 + pending.modifier - pending.penalty;
  const success =
    pending.success ??
    ((total >= pending.dc || pending.d20 === 20) && pending.d20 !== 1);
  return {
    d20: pending.d20,
    trait: pending.trait,
    modifier: pending.modifier,
    penalty: pending.penalty,
    dc: pending.dc,
    total,
    success,
  };
}

function castPendingDie(state: GameState): GameState {
  const pending = state.pendingRoll;
  if (!pending || pending.d20 != null) return state;
  const rolled = rollCheck(state, pending.trait, pending.dc);
  return {
    ...rolled.state,
    pendingRoll: {
      ...pending,
      d20: rolled.roll.d20,
      success: rolled.roll.success,
      total: rolled.roll.total,
    },
  };
}

function finishPendingDie(state: GameState): GameState {
  const pending = state.pendingRoll;
  if (!pending || pending.d20 == null) return state;
  if (pending.resume) return applyAction(state, pending.resume);
  const enc = getActiveEncounter(state) ?? allEncounters().find((e) => e.id === pending.encounterId);
  const option = enc?.choices.find((c) => c.id === pending.optionId);
  const roll = resultFromPending(pending);
  let next: GameState = { ...state, pendingRoll: null, activeEncounterId: null };
  if (roll) next = appendLog(next, rollLine(roll, pending.label), roll);
  if (option?.check) {
    const branch = roll?.success ? option.success : option.fail;
    if (branch) next = applyOutcome(next, branch);
  }
  return next;
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
  next.memories = { ...(next.memories ?? {}) };
  if (next.camp) next.camp = cloneCamp(next.camp);

  if (outcome.meters) {
    const scaled: Partial<Meters> = {};
    (Object.keys(outcome.meters) as (keyof Meters)[]).forEach((k) => {
      const amt = outcome.meters![k];
      if (amt == null) return;
      scaled[k] = amt < 0 ? Math.round(amt * 0.5) : amt;
    });
    applyMeterDelta(next.meters, scaled);
  }
  const leftoverNotes: string[] = [];
  if (outcome.inventory) {
    for (const [k, v] of Object.entries(outcome.inventory)) {
      if (v == null || v >= 0) continue;
      const key = k as CampStowItem;
      next.inventory[key] = Math.max(0, next.inventory[key] + v);
    }
    for (const [k, v] of Object.entries(outcome.inventory)) {
      if (v == null || v <= 0) continue;
      const gained = addToPack(next, k as CampStowItem, v);
      next.inventory = gained.state.inventory;
      next.camp = gained.state.camp;
      if (gained.note) leftoverNotes.push(gained.note);
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
  if (outcome.remember) {
    const { id, tag } = outcome.remember;
    const list = next.memories[id] ?? [];
    if (!list.includes(tag)) next.memories = { ...next.memories, [id]: [...list, tag] };
  }
  if (outcome.hours) next = advanceTime(next, outcome.hours);
  if (outcome.weather) {
    next.weather = outcome.weather;
    if (outcome.weather === "blizzard" && !next.inventory.extras.includes("fatwood")) {
      next.campfire = false;
      next.campfireHours = 0;
    }
  }
  if (outcome.clearFire) {
    next.campfire = false;
    next.campfireHours = 0;
  }
  if (outcome.relocate) {
    next.locationId = outcome.relocate;
    if (!next.knownLocations.includes(outcome.relocate)) {
      next.knownLocations.push(outcome.relocate);
    }
    next.campfire = false;
    next.campfireHours = 0;
    next.inventory.extras = next.inventory.extras.filter((e) => e !== "snow-hole");
    if (outcome.presentCharacter === undefined) next.presentCharacterId = null;
  }
  const beat = withLeftoverNote(
    outcome.scene ? `${outcome.text} ${outcome.scene}` : outcome.text,
    leftoverNotes.length ? leftoverNotes.join(" ") : null,
  );
  next = appendLog(next, beat);
  if (outcome.startSkirmish && !next.dead) {
    next.skirmish = {
      ...outcome.startSkirmish,
      foes: outcome.startSkirmish.foes.map((f) => ({ ...f })),
      playerCover: false,
      awaiting: "player",
    };
    next.activeEncounterId = null;
  }
  if (outcome.death && !next.dead) {
    next.dead = {
      cause: outcome.death.cause,
      detail: outcome.death.detail,
      daysSurvived: next.daysSurvived,
      season: next.season,
      locationId: next.locationId,
    };
  }
  if (outcome.invite === "part") {
    next.companionId = null;
    if (outcome.presentCharacter === undefined) next.presentCharacterId = null;
  } else if (outcome.invite === "stay" || outcome.invite === "walk") {
    const who = next.presentCharacterId;
    if (who) next.companionId = who;
  }
  if (outcome.skill) {
    const practiced = practiceSkill(next, outcome.skill);
    next = practiced.state;
    if (practiced.line) next = appendLog(next, practiced.line);
  }
  if (outcome.nextDialogue && next.presentCharacterId && !next.dead && !next.skirmish) {
    const person = CHARACTER_BY_ID[next.presentCharacterId];
    const node = person?.nodes.find((n) => n.id === outcome.nextDialogue);
    if (node) {
      next = beginEncounter(next, {
        id: `dlg-${node.id}`,
        text: node.text,
        choices: node.choices,
      });
    }
  }
  if (outcome.followUpEncounter && !next.dead && !next.skirmish) {
    const follow = allEncounters().find((e) => e.id === outcome.followUpEncounter);
    if (follow && (follow.repeatable || !next.seenEncounterIds.includes(follow.id))) {
      next = beginEncounter(next, follow);
    }
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
        detail: deathSentence(named, state.locationId),
        daysSurvived: state.daysSurvived,
        season: state.season,
        locationId: state.locationId,
      },
    };
  }
  return { ...state, meters };
}



function fireHoursLeft(state: GameState): number {
  if (state.campfireHours != null) return state.campfireHours;
  return state.campfire ? 6 : 0;
}

export function advanceTime(state: GameState, hours: number): GameState {
  if (hours <= 0) return state;
  let next = { ...state, meters: { ...state.meters } };
  if (next.camp) next.camp = cloneCamp(next.camp);
  let burning = fireHoursLeft(next);
  if (burning > 0) next.campfire = true;
  let campNotes: string[] = [];
  for (let i = 0; i < hours; i++) {
    if (next.dead) break;
    applyMeterDelta(next.meters, drainForHour(next), true);
    const fireAtCamp = Boolean(next.campfire && atOwnCamp(next));
    next.hour += 1;
    let newDay = false;
    if (next.hour >= 24) {
      next.hour = 0;
      next.dayOfYear += 1;
      next.daysSurvived += 1;
      newDay = true;
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
    if (next.camp) {
      const rng = mulberry32(next.rngSeed + next.hour + i * 19);
      const ticked = tickCampHour(next.camp, {
        fireAtCamp,
        blizzard: next.weather === "blizzard",
        newDay,
        atCamp: atOwnCamp(next),
        rng,
      });
      next.camp = ticked.camp;
      campNotes = campNotes.concat(ticked.notes);
      next.rngSeed = nextSeed(next.rngSeed);
    }
    next = finalizeHealth(next, true);
  }
  if (next.camp && campNotes.includes("ravens")) {
    next.camp = addCampExtra(next.camp, "raven-theft");
  }
  return next;
}

function matchesEncounter(enc: EncounterDef, state: GameState, kind?: EncounterTrigger): boolean {
  if (!enc.repeatable && state.seenEncounterIds.includes(enc.id)) return false;
  if (enc.season) {
    const seasons = Array.isArray(enc.season) ? enc.season : [enc.season];
    if (!seasons.includes(state.season)) return false;
  }
  if (enc.locations && enc.locations !== "any") {
    if (!enc.locations.includes(state.locationId)) return false;
  }
  if (enc.weather && !enc.weather.includes(state.weather)) return false;
  if (enc.characterId && enc.characterId !== state.presentCharacterId) return false;
  if (enc.timeBands && !enc.timeBands.includes(timeBand(state.hour))) return false;
  if (enc.locationTags) {
    const loc = LOCATION_BY_ID[state.locationId];
    if (!enc.locationTags.some((t) => loc?.tags.includes(t))) return false;
  }
  if (kind && enc.triggers && enc.triggers.length > 0 && !enc.triggers.includes(kind)) return false;
  if (enc.id.startsWith("camp-") && (!state.camp || state.camp.locationId !== state.locationId)) {
    return false;
  }
  return true;
}

function pickEncounter(state: GameState, kind: EncounterTrigger): EncounterDef {
  const pool = allEncounters().filter((e) => matchesEncounter(e, state, kind));
  const choreKind = kind === "search" || kind === "arrive" || kind === "wait" ? kind : "wait";
  if (pool.length === 0) return choreEncounter(state, choreKind);
  const rng = mulberry32(state.rngSeed + kind.length * 17);
  const band = timeBand(state.hour);
  const weights = pool.map((e) => {
    let w = e.weight ?? (e.locations === "any" || !e.locations ? 1 : 2);
    if (e.triggers?.includes(kind)) w += 3;
    if (e.timeBands?.includes(band)) w += 1;
    if (e.intense) w += 8;
    return w;
  });
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
  const mark = isUniqueStory(enc) && !enc.repeatable;
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
  if (enc.intense) {
    const risky = enc.choices.find((c) => c.check);
    const pending = risky ? makePendingRoll(next, enc, risky) : null;
    if (pending) next = { ...next, pendingRoll: pending };
  }
  return next;
}

function maybeRipple(state: GameState, kind: EncounterTrigger, chance: number): GameState {
  if (state.dead || state.skirmish) return state;
  const enc = pickEncounter(state, kind);
  if (!isUniqueStory(enc)) return state;
  const rng = mulberry32(state.rngSeed);
  const next = { ...state, rngSeed: nextSeed(state.rngSeed) };
  if (rng() < chance) return beginEncounter(next, enc);
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

function inSeason(c: (typeof CHARACTERS)[number], state: GameState) {
  return c.seasons === "all" || c.seasons.includes(state.season);
}

function inHours(c: (typeof CHARACTERS)[number], hour: number) {
  if (!c.hours || c.hours.length === 0) return true;
  return c.hours.includes(timeBand(hour));
}

function presentPeople(state: GameState, opts?: { ignoreHours?: boolean }) {
  return CHARACTERS.filter((c) => {
    if (!c.home.includes(state.locationId)) return false;
    if (!inSeason(c, state)) return false;
    if (!opts?.ignoreHours && !inHours(c, state.hour)) return false;
    return true;
  });
}

function smokeVisitorPool(state: GameState) {
  const loc = LOCATION_BY_ID[state.locationId];
  const nearby = new Set<LocationId>([state.locationId, ...(loc?.connections.map((e) => e.to) ?? [])]);
  return CHARACTERS.filter((c) => {
    if (!inSeason(c, state)) return false;
    if (WANDERERS.includes(c.id as (typeof WANDERERS)[number])) return true;
    return c.home.some((h) => nearby.has(h));
  });
}

const CORE_PEOPLE = new Set(["eliza-ward", "silas-crowe", "two-crows"]);

function maybePresentCharacter(state: GameState, opts?: { smoke?: boolean }): GameState {
  const smokePull = Boolean(opts?.smoke || (atOwnCamp(state) && (state.camp?.smoke ?? 0) >= 2));
  const onHours = presentPeople(state);
  const coreHere = onHours.filter((c) => CORE_PEOPLE.has(c.id));
  const othersHere = onHours.filter((c) => !CORE_PEOPLE.has(c.id));
  const rng = mulberry32(state.rngSeed + 99);
  let nextSeeded: GameState = { ...state, rngSeed: nextSeed(state.rngSeed) };

  if (coreHere.length && rng() < 0.58) {
    const pick = coreHere[Math.floor(rng() * coreHere.length)]!;
    return { ...nextSeeded, presentCharacterId: pick.id };
  }
  if (smokePull) {
    const pool = smokeVisitorPool(state).filter((c) => CORE_PEOPLE.has(c.id));
    if (pool.length && rng() < 0.4) {
      const pick = pool[Math.floor(rng() * pool.length)]!;
      return { ...nextSeeded, presentCharacterId: pick.id };
    }
  }
  if (othersHere.length && rng() < 0.08) {
    const pick = othersHere[Math.floor(rng() * othersHere.length)]!;
    return { ...nextSeeded, presentCharacterId: pick.id };
  }
  return { ...nextSeeded, presentCharacterId: null };
}

function rememberTag(state: GameState, id: CharacterId, tag: string): GameState {
  const memories = { ...(state.memories ?? {}) };
  const list = memories[id] ?? [];
  if (list.includes(tag)) return { ...state, memories };
  return { ...state, memories: { ...memories, [id]: [...list, tag] } };
}

function maybeSmokeRipple(state: GameState): GameState {
  if (!atOwnCamp(state) || !state.camp || state.camp.smoke < 3) return state;
  return maybeRipple(state, "smoke", 0.35);
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(rng: () => number, base: number, amt: number, min: number, max: number) {
  const d = Math.floor(rng() * (amt * 2 + 1)) - amt;
  return Math.max(min, Math.min(max, base + d));
}

const START_PLACES: LocationId[] = [
  "high-camp",
  "timberline",
  "creek",
  "burned-timber",
  "lightning-pine",
  "cabin-approach",
  "beaver-meadow",
  "cache-deadfall",
  "wind-saddle",
];

function pickWeightedDay(rng: () => number): number {
  const roll = rng();
  // Spring ~32%, summer ~23%, fall ~30%, winter ~15%.
  let seasonStart: number;
  let span = DAYS_PER_SEASON;
  if (roll < 0.32) seasonStart = 0;
  else if (roll < 0.55) seasonStart = DAYS_PER_SEASON;
  else if (roll < 0.85) seasonStart = DAYS_PER_SEASON * 2;
  else seasonStart = DAYS_PER_SEASON * 3;
  return seasonStart + Math.floor(rng() * span);
}

export function createGame(name: string, kit: Kit): GameState {
  const trimmed = name.trim() || "Trapper";
  const seed = (hashString(trimmed) ^ Date.now() ^ Math.imul(kit.length + 1, 99991)) >>> 0;
  const rng = mulberry32(seed);

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
    hunger: jitter(rng, 62, 8, 20, 90),
    thirst: jitter(rng, 64, 8, 20, 90),
    warmth: jitter(rng, 52, 8, 20, 90),
    energy: jitter(rng, 58, 8, 20, 90),
    health: jitter(rng, 82, 8, 70, 90),
  };
  inventory.rations = Math.max(1, inventory.rations + Math.floor(rng() * 3) - 1);
  inventory.water = Math.max(1, inventory.water + Math.floor(rng() * 3) - 1);
  inventory.firewood = Math.max(0, inventory.firewood + Math.floor(rng() * 3) - 1);
  if (kit === "rations") {
    inventory.rations += 4;
    traits.grit += 1;
  } else if (kit === "powder") {
    inventory.powder += 4;
    traits.eye += 1;
  } else if (kit === "snowshoes") {
    inventory.extras.push("snowshoes");
    traits.savvy += 1;
  } else if (kit === "pot") {
    inventory.extras.push("tin-pot");
    traits.hands += 1;
  } else if (kit === "fatwood") {
    inventory.extras.push("fatwood");
    traits.hands += 1;
  } else {
    inventory.coat = true;
    meters.warmth = Math.max(meters.warmth, 70);
    traits.grit += 1;
  }

  const dayOfYear = pickWeightedDay(rng);
  const season = seasonFromDay(dayOfYear);
  const hours = [5, 6, 7, 8, 16, 18] as const;
  const hour = hours[Math.floor(rng() * hours.length)]!;
  const weather = pickWeather(season, rng);

  let place = START_PLACES[Math.floor(rng() * START_PLACES.length)]!;
  let locationId: LocationId = place === "cabin-approach" ? "timberline" : place;
  const loc = LOCATION_BY_ID[locationId];
  const connected = [...(loc?.connections.map((c) => c.to) ?? [])];
  const extraCount = 1 + Math.floor(rng() * 3);
  const knownLocations: LocationId[] = [locationId];
  if (place === "cabin-approach" && !knownLocations.includes("abandoned-cabin")) {
    knownLocations.push("abandoned-cabin");
  }
  while (knownLocations.length < extraCount + 1 && connected.length) {
    const i = Math.floor(rng() * connected.length);
    const id = connected.splice(i, 1)[0]!;
    if (!knownLocations.includes(id)) knownLocations.push(id);
  }

  const opening = pickOpening(rng, locationId, season, hour, seed);
  let state: GameState = {
    name: trimmed,
    kit,
    dayOfYear,
    hour,
    daysSurvived: 0,
    year: 0,
    season,
    weather,
    locationId,
    knownLocations,
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
    pendingRoll: null,
    campfire: false,
    campfireHours: 0,
    camp: null,
    memories: {},
    openingId: opening.id,
    skills: {},
    companionId: null,
    waitScene: null,
    dead: null,
    rngSeed: nextSeed(seed),
  };
  if (opening.apply) state = opening.apply(state, mulberry32(state.rngSeed));
  state.rngSeed = nextSeed(state.rngSeed);
  if (state.presentCharacterId) {
    // Opening may seat someone; leave them.
  } else {
    state = maybePresentCharacter(state);
  }
  return appendLog(state, opening.text(state));
}

function resolveEncounterChoice(state: GameState, optionId: string): GameState {
  const enc = getActiveEncounter(state);
  if (!enc) return { ...state, activeEncounterId: null, pendingRoll: null };
  const option = enc.choices.find((c) => c.id === optionId);
  if (!option) return { ...state, activeEncounterId: null, pendingRoll: null };
  if (option.check && isDramaticCheck(enc, option)) {
    if (state.pendingRoll?.optionId === option.id && state.pendingRoll.d20 == null) return state;
    const pending = makePendingRoll(state, enc, option);
    return pending ? { ...state, pendingRoll: pending } : state;
  }
  return resolveChoice({ ...state, pendingRoll: null }, option, true);
}

function resolveChoice(state: GameState, option: EncounterChoice, closeEncounter: boolean): GameState {
  const keepTalk = Boolean(option.outcome?.nextDialogue || option.success?.nextDialogue || option.fail?.nextDialogue);
  let next = closeEncounter && !keepTalk ? { ...state, activeEncounterId: null } : state;
  if (option.check) {
    const rolled = rollCheck(next, option.check.trait, option.check.dc);
    next = rolled.state;
    const branch = rolled.roll.success ? option.success : option.fail;
    next = appendLog(next, rollLine(rolled.roll), rolled.roll);
    if (branch) next = applyOutcome(next, branch);
    return next;
  }
  if (option.outcome) next = applyOutcome(next, option.outcome);
  return next;
}

function fallbackLine(person: (typeof CHARACTERS)[number], tags: string[]): string {
  const bits: string[] = [];
  if (tags.includes("shared-meat")) bits.push("The meat you shared still sits between you like a third person.");
  if (tags.includes("stole")) bits.push("They look at your hands as if the taking were still on them.");
  if (tags.includes("left-in-storm")) bits.push("The storm you walked out of is still in their face.");
  if (tags.includes("sat-at-fire")) bits.push("They nod at the idea of your fire, even if it is not this one.");
  if (tags.includes("struck-camp")) bits.push("They mention the empty ring of stones you left. Not kindly.");
  if (bits.length === 0) return person.fallback;
  return `${person.fallback} ${bits[0]}`;
}

function talk(state: GameState): GameState {
  const id = state.presentCharacterId;
  if (!id) {
    return appendLog({ ...state, hour: state.hour }, "No one is here who will answer you.");
  }
  const person = CHARACTER_BY_ID[id];
  if (!person) return state;
  const mem = state.memories?.[id] ?? [];
  const fits = (n: (typeof person.nodes)[number]) => {
    if (n.seasons && !n.seasons.includes(state.season)) return false;
    if (n.minStanding != null && (state.standing[id] ?? 0) < n.minStanding) return false;
    if (n.requiresExtra && !state.inventory.extras.includes(n.requiresExtra)) return false;
    if (n.unlessExtra && state.inventory.extras.includes(n.unlessExtra)) return false;
    if (n.requiresMemory && !mem.includes(n.requiresMemory)) return false;
    if (n.unlessMemory && mem.includes(n.unlessMemory)) return false;
    return true;
  };
  const node =
    person.nodes.find((n) => fits(n) && !n.repeatable && !state.seenDialogueIds.includes(n.id)) ??
    person.nodes.find((n) => fits(n) && n.repeatable);
  if (!node) {
    return appendLog(advanceTime(state, 1), fallbackLine(person, mem));
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
  const hours = trailHours(state, edge.hours);
  let next: GameState = {
    ...state,
    campfire: false,
    campfireHours: 0,
    presentCharacterId: state.companionId ?? null,
    activeEncounterId: null,
    inventory: {
      ...state.inventory,
      extras: state.inventory.extras.filter((e) => e !== "snow-hole"),
    },
  };
  next = advanceTime(next, hours);
  if (next.dead) {
    return appendLog(next, `You try for ${LOCATION_BY_ID[to]?.name ?? to}. The trail takes more than you have.`);
  }
  next.locationId = to;
  if (!next.knownLocations.includes(to)) next.knownLocations = [...next.knownLocations, to];
  const arrivingCamp = Boolean(next.camp && next.camp.locationId === to);
  next = maybePresentCharacter(next, { smoke: arrivingCamp && (next.camp?.smoke ?? 0) >= 2 });
  if (state.companionId) {
    next.companionId = state.companionId;
    next.presentCharacterId = state.companionId;
  }
  let arrival = arrivalParagraph(next, to, edge.trailName);
  if (state.companionId) {
    const name = CHARACTER_BY_ID[state.companionId]?.name ?? "Your company";
    arrival = `${arrival} ${name} is still with you.`;
  }
  if (arrivingCamp) {
    const jobs = readyJobLine(next.camp);
    if (jobs) arrival = `${arrival} ${jobs}`;
    if (next.camp?.cache.extras.includes("raven-theft")) {
      arrival = `${arrival} Ravens have been at the rack.`;
      next.camp = cloneCamp(next.camp);
      next.camp.cache.extras = next.camp.cache.extras.filter((e) => e !== "raven-theft");
    }
    if (next.camp?.cache.extras.includes("rock-theft")) {
      arrival = `${arrival} The rock you left meat under is a rock again.`;
    }
  }
  next = appendLog(next, arrival);
  const fallRng = mulberry32(next.rngSeed);
  next = { ...next, rngSeed: nextSeed(next.rngSeed) };
  if (next.weather === "blizzard" && fallRng() < 0.15) {
    return applyOutcome(next, {
      text: "In the white, the ground drops. You find it with your ribs.",
      meters: { health: -14, energy: -10 },
      hours: 1,
    });
  }
  if (arrivingCamp && (next.camp?.smoke ?? 0) >= 2 && mulberry32(next.rngSeed)() < 0.4) {
    next = { ...next, rngSeed: nextSeed(next.rngSeed) };
    const smokeEnc = pickEncounter(next, "smoke");
    if (isUniqueStory(smokeEnc) && mulberry32(next.rngSeed)() < 0.7) {
      return beginEncounter(next, smokeEnc);
    }
  }
  const enc = pickEncounter(next, "arrive");
  if (isUniqueStory(enc) && mulberry32(next.rngSeed)() < 0.8) {
    return beginEncounter(next, enc);
  }
  if (arrivingCamp) return maybeSmokeRipple(next);
  return next;
}

function sleep(state: GameState): GameState {
  const shelter = hasShelter(state);
  const fire = state.campfire;
  const hours = 8;
  let next = advanceTime(state, hours);
  if (next.dead) {
    return appendLog(next, "You lie down. The mountain does the rest.");
  }
  next.meters = { ...next.meters };
  next.inventory = { ...next.inventory, extras: [...next.inventory.extras] };
  next.meters.energy = clamp(next.meters.energy + (fire || shelter ? 35 : 18));
  if (fire || shelter) next.meters.warmth = clamp(next.meters.warmth + 12);
  else next.meters.warmth = clamp(next.meters.warmth - 6);
  if (state.weather === "blizzard" && !shelter && !fire) {
    next.meters.warmth = clamp(next.meters.warmth - 12);
    next.meters.health = clamp(next.meters.health - 4);
  }
  const stillBurning = fire && shelter && fireHoursLeft(next) > 0;
  next.campfire = stillBurning;
  if (!stillBurning) next.campfireHours = 0;
  next.presentCharacterId = next.companionId ?? null;
  next.activeEncounterId = null;
  next.inventory.extras = next.inventory.extras.filter((e) => e !== "dry-boots");
  next = appendLog(next, sleepCopy(state));
  const rng = mulberry32(next.rngSeed);
  next = { ...next, rngSeed: nextSeed(next.rngSeed) };
  if (!shelter && rng() < 0.14) {
    if (rng() < 0.5 && next.inventory.rations > 0) {
      next.inventory = { ...next.inventory, rations: next.inventory.rations - 1 };
      next = maybeRipple(next, "sleep", 0.75);
    } else {
      const loc = LOCATION_BY_ID[state.locationId];
      const edge = loc?.connections[Math.floor(rng() * (loc?.connections.length ?? 1))];
      if (edge && rng() < 0.55) {
        next.locationId = edge.to;
        if (!next.knownLocations.includes(edge.to)) {
          next.knownLocations = [...next.knownLocations, edge.to];
        }
        next.inventory.extras = next.inventory.extras.filter((e) => e !== "snow-hole");
      }
      next = maybeRipple(next, "sleep", 0.65);
    }
  } else {
    next = maybeRipple(next, "sleep", 0.24);
  }
  next = maybeSmokeRipple(next);
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
  let next: GameState = {
    ...state,
    log: [],
    skirmish: { ...state.skirmish, foes: state.skirmish.foes.map((f) => ({ ...f })) },
  };
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
      detail: deathSentence("violence", next.locationId),
      daysSurvived: next.daysSurvived,
      season: next.season,
      locationId: next.locationId,
    };
    next.skirmish = null;
  }
  return next;
}

function pitchCopy(state: GameState, usedWood: boolean): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const name = loc?.name ?? "this ground";
  if (usedWood) {
    return `You pick the ground at ${name} the way a man picks a grave: for drainage, for wind, for the lie that this will be temporary. Stones for a ring. One stick of wood to start a claim. The mountain does not object.`;
  }
  return `You pick the ground at ${name}. Stones stacked in a ring, no wood spent. A claimed bench, not yet a camp. Canvas still in the pack. The Front Range files the claim without reading it.`;
}

function strikeCopy(state: GameState, leftBehind: boolean, jobNote: string): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const name = loc?.name ?? "this ground";
  const left = leftBehind
    ? " The pack will not take it all. What stays is a gift to ravens and whoever walks this bench next."
    : " The pack takes what the pack can.";
  return `You pull the stakes at ${name}. Poles come up dirty. The ring of stone stays, which is how a camp dies without a speech. ${jobNote}.${left} You were a resident. Now you are weather.`;
}

function pitchCamp(state: GameState): GameState {
  if (state.camp) {
    return appendLog(state, "You already have a camp. Pull those stakes before you claim another bench.");
  }
  if (!canPitch(state)) {
    if (CLAIMED_HERE(state.locationId)) {
      return appendLog(state, "This ground is spoken for. Pitching here would be a kind of theft the owners would notice.");
    }
    return appendLog(state, "This is not a bench you can claim. Wind, rock, or someone else’s fire.");
  }
  let next: GameState = {
    ...state,
    inventory: { ...state.inventory, extras: [...state.inventory.extras] },
  };
  const usedWood = next.inventory.firewood > 0;
  if (usedWood) next.inventory.firewood -= 1;
  next.camp = emptyCamp(state.locationId, { fireRing: usedWood, smoke: usedWood ? 1 : 0 });
  next = appendLog(advanceTime(next, 2), pitchCopy(state, usedWood));
  return maybeRipple(next, "camp", 0.45);
}

function CLAIMED_HERE(id: LocationId) {
  return (
    id === "ute-camp" ||
    id === "arapaho-ground" ||
    id === "mexican-trail-camp" ||
    id === "abandoned-cabin" ||
    id === "homesteader-ruin"
  );
}

function beginWait(state: GameState): GameState {
  if (state.waitScene) return state;
  const hours = waitHours(state);
  const rng = mulberry32(state.rngSeed);
  let arrivalId: CharacterId | null = null;
  if (!state.companionId && !state.presentCharacterId && rng() < 0.45) {
    const here = presentPeople(state);
    const core = here.filter((c) => CORE_PEOPLE.has(c.id));
    const pool = core.length ? core : rng() < 0.12 ? here : [];
    if (pool.length) arrivalId = pool[Math.floor(rng() * pool.length)]!.id;
  }
  const scene: WaitScene = {
    hours,
    fromHour: state.hour,
    fireLit: state.campfire,
    fireDies: state.campfire && fireHoursLeft(state) <= hours,
    arrivalId,
  };
  return { ...state, rngSeed: nextSeed(state.rngSeed), waitScene: scene };
}

function finishWait(state: GameState): GameState {
  const scene = state.waitScene;
  if (!scene) return state;
  let next: GameState = { ...state, waitScene: null };
  next = advanceTime(next, scene.hours);
  if (next.dead) return appendLog(next, "You wait. The weather finishes the sentence.");
  const rng = mulberry32(next.rngSeed);
  next = { ...next, rngSeed: nextSeed(next.rngSeed) };
  if (state.weather === "wind" && rng() < 0.22) next.weather = "clear";
  else if (state.weather === "storm" && rng() < 0.18) next.weather = "wind";
  else if (state.weather === "clear" && rng() < 0.08) next.weather = pickWeather(next.season, rng);
  next = appendLog(next, waitFlavor(next));
  if (state.companionId) {
    next.companionId = state.companionId;
    next.presentCharacterId = state.companionId;
  } else if (scene.arrivalId) {
    next.presentCharacterId = scene.arrivalId;
    const name = CHARACTER_BY_ID[scene.arrivalId]?.name;
    if (name) next = appendLog(next, `${name} walks into the hour without asking.`);
  }
  if (scene.fireDies) {
    next = appendLog(next, "The fire goes to a rumor of coal.");
  }
  const enc = pickEncounter(next, "wait");
  if (isUniqueStory(enc) && rng() < 0.18) {
    return beginEncounter(next, enc);
  }
  return next;
}

function withPractice(state: GameState, id: "ice" | "sign" | "hide" | "rifle" | "camp", ok: boolean): GameState {
  if (!ok) return state;
  const practiced = practiceSkill(state, id);
  let next = practiced.state;
  if (practiced.line) next = appendLog(next, practiced.line);
  return next;
}

function sewHideBag(state: GameState): GameState {
  if (state.inventory.extras.includes("hide-bag") || state.inventory.extras.includes("parfleche")) {
    return appendLog(state, "You already carry a bag that does not lie.");
  }
  if (state.inventory.pelts < 2) return appendLog(state, "A hide bag wants two pelts.");
  if (!state.inventory.knife) return appendLog(state, "The knife would help. The teeth would not.");
  let next: GameState = {
    ...state,
    inventory: {
      ...state.inventory,
      pelts: state.inventory.pelts - 2,
      extras: [...state.inventory.extras, "hide-bag"],
    },
  };
  next = withPractice(next, "hide", true);
  return appendLog(
    advanceTime(next, 3),
    "You sew a bag that will hold more than pride. The pack gets honest about its job.",
  );
}

function expandCache(state: GameState): GameState {
  if (!atOwnCamp(state) || !state.camp?.cachePit) {
    return appendLog(state, "A cellar wants a pit that is already yours.");
  }
  if (state.camp.cache.extras.includes("cellar")) {
    return appendLog(state, "The pit already goes deeper than luck.");
  }
  const spent = spendFromPackOrCache(state, "firewood", 2);
  if (!spent) return appendLog(state, "Two sticks to crib the walls. You do not have them.");
  let next: GameState = spent;
  next.camp = cloneCamp(next.camp!);
  next.camp.cache.extras = [...next.camp.cache.extras, "cellar"];
  next = withPractice(next, "camp", true);
  return appendLog(
    advanceTime(next, 3),
    "You crib the pit and go down a body-length. Cold air. Room. The mountain rents it to you without paperwork.",
  );
}

function partWays(state: GameState): GameState {
  const id = state.companionId ?? state.presentCharacterId;
  if (!id) return appendLog(state, "No one is walking with you who could leave.");
  const name = CHARACTER_BY_ID[id]?.name ?? "They";
  return appendLog(
    { ...state, companionId: null, presentCharacterId: null, activeEncounterId: null },
    `${name} takes a different sentence. The trail does not argue.`,
  );
}

function strikeCamp(state: GameState): GameState {
  if (!atOwnCamp(state) || !state.camp) {
    if (state.camp) return appendLog(state, "Your camp is not this ground. Walk there if you mean to pull stakes.");
    return appendLog(state, "There is no camp to strike. Stones, if any, belong to the last man.");
  }
  const camp = cloneCamp(state.camp);
  let inv: Inventory = { ...state.inventory, extras: [...state.inventory.extras] };
  const recovered = recoverOnStrike(camp, inv);
  inv = recovered.inv;
  const packed = packLeftover(inv, camp.cache);
  let next: GameState = {
    ...state,
    inventory: packed.inv,
    camp: null,
    memories: { ...(state.memories ?? {}) },
  };
  if (next.presentCharacterId) {
    next = rememberTag(next, next.presentCharacterId, "struck-camp");
  }
  next = appendLog(advanceTime(next, 2), strikeCopy(state, packed.leftBehind, recovered.note));
  return maybeRipple(next, "camp", 0.3);
}

function buildPiece(state: GameState, piece: CampPiece): GameState {
  if (!atOwnCamp(state) || !state.camp) return appendLog(state, "Build where you have claimed a bench.");
  if (state.camp[piece]) return appendLog(state, "That work is already standing.");
  let next: GameState = { ...state, camp: cloneCamp(state.camp), inventory: { ...state.inventory, extras: [...state.inventory.extras] } };
  const hours = buildHours(piece);

  if (piece === "leanTo") {
    const spent = spendFromPackOrCache(next, "firewood", 2);
    if (!spent) return appendLog(state, "A lean-to wants two sticks of wood you do not have.");
    next = spent;
    next.camp = cloneCamp(next.camp!);
    next.camp.leanTo = true;
    next = withPractice(next, "camp", true);
    next = appendLog(
      advanceTime(next, hours),
      "Poles, boughs, a roof that is mostly an argument. You crawl under it anyway. This is what passes for a house.",
    );
    return next;
  }
  if (piece === "fireRing") {
    const spent = spendFromPackOrCache(next, "firewood", 1) ?? next;
    next = spent;
    next.camp = cloneCamp(next.camp!);
    next.camp.fireRing = true;
    next = appendLog(
      advanceTime(next, hours),
      "You stack a ring of stone. Wind will still find you. The ring is for your own argument, and for fire when you have it.",
    );
    return next;
  }
  if (piece === "woodpile") {
    const spent = spendFromPackOrCache(next, "firewood", 1);
    if (!spent) return appendLog(state, "A woodpile wants a first stick.");
    next = spent;
    next.camp = cloneCamp(next.camp!);
    next.camp.woodpile = true;
    next = appendLog(
      advanceTime(next, hours),
      `You stack a pile that will hold more than the pack (${firewoodCap(next.camp)} if you fetch it). The wind starts editing immediately.`,
    );
    return next;
  }
  if (piece === "cachePit") {
    if (state.season === "winter") {
      const rolled = rollCheck(next, "hands", 11);
      next = appendLog(
        rolled.state,
        `Pit — d20 ${rolled.roll.d20} + hands ${rolled.roll.modifier} − ${rolled.roll.penalty} = ${rolled.roll.total} vs 11.`,
        rolled.roll,
      );
      if (!rolled.roll.success) {
        next.meters = { ...next.meters, energy: clamp(next.meters.energy - 6) };
        next.camp = cloneCamp(next.camp!);
        next.camp.cachePit = true;
        next = appendLog(
          advanceTime(next, hours + 1),
          "Frozen ground. You get the pit anyway, paid in skin and an extra hour of hate.",
        );
        return next;
      }
    }
    next.camp = cloneCamp(next.camp!);
    next.camp.cachePit = true;
    next = appendLog(
      advanceTime(next, hours),
      "You dig a pit and lid it with stone. Meat can live here. The rock-on-a-ration days are a story you tell other men.",
    );
    return next;
  }
  if (piece === "dryingRack") {
    const spent = spendFromPackOrCache(next, "firewood", 1);
    if (!spent) return appendLog(state, "A rack wants a pole.");
    next = spent;
    next.camp = cloneCamp(next.camp!);
    next.camp.dryingRack = true;
    next = appendLog(
      advanceTime(next, hours),
      "Poles and a crosspiece. Meat can hang here until it forgets it was wet. Ravens will file an opinion.",
    );
    return next;
  }
  // pot
  const hasTin = next.inventory.extras.includes("tin-pot") || next.camp!.cache.extras.includes("tin-pot");
  if (hasTin) {
    next.inventory.extras = next.inventory.extras.filter((e) => e !== "tin-pot");
    if (next.camp!.cache.extras.includes("tin-pot")) {
      next.camp = cloneCamp(next.camp!);
      next.camp.cache.extras = next.camp.cache.extras.filter((e) => e !== "tin-pot");
    }
  } else {
    const spent = spendFromPackOrCache(next, "pelts", 2);
    if (!spent) {
      return appendLog(state, "A pot wants a tin, or two pelts traded into one. You have neither.");
    }
    next = spent;
  }
  next.camp = cloneCamp(next.camp!);
  next.camp.pot = true;
  next = appendLog(
    advanceTime(next, hours),
    hasTin
      ? "You rig the tin over the ring. Steam becomes a plan."
      : "Two pelts go to a pot that is more idea than metal. It will boil. It will not impress Eliza.",
  );
  return next;
}

function stowItem(state: GameState, item: CampStowItem, amount: number): GameState {
  if (!atOwnCamp(state) || !state.camp) return appendLog(state, "Stow where you have a camp.");
  const cap = cacheCap(state.camp, item);
  if (cap <= 0) {
    return appendLog(
      state,
      item === "rations"
        ? "Without a pit you can only leave meat on a rock, and the rock is already a rumor."
        : "Without a pit this cache will not hold that. Dig, or keep it on your back.",
    );
  }
  const have = state.inventory[item];
  if (have <= 0) return appendLog(state, "The pack has none of that to leave.");
  const room = cap - state.camp.cache[item];
  if (room <= 0) return appendLog(state, "The cache is full of that. The pack keeps the rest.");
  const move = Math.min(amount, have, room);
  const next: GameState = {
    ...state,
    inventory: { ...state.inventory, [item]: have - move },
    camp: cloneCamp(state.camp),
  };
  next.camp!.cache[item] += move;
  const label =
    item === "rations" && !state.camp.cachePit
      ? "You leave meat under a rock and tell yourself it is a cache. The country may collect a tithe."
      : item === "rations"
        ? "You stow meat in the pit. Rocks on the lid. A mark only you will admit to."
        : item === "water"
          ? "You leave water at camp. The tin sits in shade like a small argument won."
          : item === "firewood"
            ? "Wood on the pile. The wind starts editing immediately."
            : "You put it in the pit and try not to think of the walk back.";
  return appendLog(advanceTime(next, 1), label);
}

function takeFromCache(state: GameState, item: CampStowItem, amount: number): GameState {
  if (!atOwnCamp(state) || !state.camp) return appendLog(state, "There is no cache here that is yours.");
  const have = state.camp.cache[item];
  if (have <= 0) return appendLog(state, "The cache is empty of that.");
  const room = packRoom(state.inventory, item);
  if (room <= 0) {
    return appendLog(
      state,
      `The pack is already at its honest limit (${packCap(state.inventory, item)} ${item}). Leftover stays in the pit.`,
    );
  }
  const move = Math.min(amount, have, room);
  const next: GameState = {
    ...state,
    inventory: { ...state.inventory, [item]: state.inventory[item] + move },
    camp: cloneCamp(state.camp),
  };
  next.camp!.cache[item] -= move;
  const leftover = next.camp!.cache[item];
  const label =
    item === "water"
      ? leftover
        ? "You take water from camp. The rest stays in the shade."
        : "You take water from camp."
      : leftover
        ? `You take what the pack will carry. ${leftover} ${item} stay.`
        : `You take ${item} from camp.`;
  return appendLog(advanceTime(next, 1), label);
}

function cookAtCamp(state: GameState): GameState {
  const can = canCook(state);
  if (!can.ok) return appendLog(state, can.reason ?? "You cannot cook here.");
  let next = spendFromPackOrCache(state, "rations", 1);
  if (!next) return appendLog(state, "No meat to cook.");
  next = spendFromPackOrCache(next, "water", 1);
  if (!next) return appendLog(state, "No water for the pot.");
  if (!next.campfire) {
    const withWood = spendFromPackOrCache(next, "firewood", 1);
    if (!withWood) return appendLog(state, "Need a fire, or a ring and wood.");
    next = withWood;
    next.campfire = true;
    next.campfireHours = 4;
  }
  next.camp = cloneCamp(next.camp!);
  const smokeAdd = 2 + (mulberry32(next.rngSeed)() < 0.5 ? 1 : 0);
  next.rngSeed = nextSeed(next.rngSeed);
  next.camp.smoke = Math.min(5, next.camp.smoke + smokeAdd);
  const hunger = can.good ? 18 : 12;
  const warmth = can.good ? 8 : 3;
  next.meters = {
    ...next.meters,
    hunger: clamp(next.meters.hunger + hunger),
    warmth: clamp(next.meters.warmth + warmth),
  };
  const text = can.good
    ? "The pot goes on. Fat, water, the idea of salt. Hunger steps back. Smoke writes your name on the sky."
    : "Bark and a tin stand-in. It boils if you believe in it. The meat is cooked in the way a rumor is true. Smoke still goes up.";
  next = appendLog(advanceTime(next, 1), text);
  if ((next.camp?.smoke ?? 0) >= 3 && !next.presentCharacterId) {
    next = maybePresentCharacter(next, { smoke: true });
    const guest = next.presentCharacterId;
    if (guest) {
      next = rememberTag(next, guest, "sat-at-fire");
      next = rememberTag(next, guest, "shared-meat");
    }
  }
  next = maybeRipple(next, "smoke", 0.45);
  return maybeRipple(next, "eat", 0.2);
}

function startCampJob(state: GameState, kind: CampJob["kind"]): GameState {
  const can = canStartJob(state, kind);
  if (!can.ok) return appendLog(state, can.reason ?? "You cannot start that here.");
  let next: GameState = { ...state, camp: cloneCamp(state.camp!), inventory: { ...state.inventory, extras: [...state.inventory.extras] } };
  let payload = 0;
  if (kind === "dry-meat") {
    const spent = spendFromPackOrCache(next, "rations", 2);
    if (!spent) return appendLog(state, "Need two rations to hang.");
    next = spent;
    next.camp = cloneCamp(next.camp!);
    payload = 2;
  }
  if (kind === "smoke-hide") {
    const spent = spendFromPackOrCache(next, "pelts", 1);
    if (!spent) return appendLog(state, "Need a pelt.");
    next = spent;
    next.camp = cloneCamp(next.camp!);
    payload = 1;
    if (!next.campfire && next.camp.fireRing) {
      const wood = spendFromPackOrCache(next, "firewood", 1);
      if (wood) {
        next = wood;
        next.camp = cloneCamp(next.camp!);
        next.campfire = true;
        next.campfireHours = 6;
      }
    }
  }
  if (kind === "bank-coals" && !next.campfire) {
    return appendLog(state, "Bank coals while there is a fire to bank.");
  }
  const job: CampJob = {
    id: `${kind}-${state.dayOfYear}-${state.hour}-${state.rngSeed.toString(36)}`,
    kind,
    hoursLeft: jobHours(kind),
    startedOnDay: state.dayOfYear,
    payload,
  };
  next.camp!.jobs = [...next.camp!.jobs, job];
  const line = {
    "dry-meat": "You hang two rations on the rack. Sixteen hours, if the ravens file no appeal.",
    "bank-coals": "You bury the red eye under ash. Morning will be less of a thief.",
    "set-snares": "Wire off camp, baited with hope, which is poor bait. Twelve hours.",
    "smoke-hide": "A pelt on poles. Smoke takes it the way a lung takes air. The smell is a letter.",
  }[kind];
  next = appendLog(advanceTime(next, 1), line);
  if (kind === "smoke-hide") next = maybeRipple(next, "smoke", 0.4);
  return next;
}

function collectCampJob(state: GameState, id: string): GameState {
  if (!atOwnCamp(state) || !state.camp) return appendLog(state, "Collect it at the camp that did the work.");
  const job = state.camp.jobs.find((j) => j.id === id);
  if (!job) return appendLog(state, "That work is not here.");
  if (job.hoursLeft > 0) {
    return appendLog(state, `Not yet. ${job.hoursLeft} hours still on ${jobLabel(job.kind)}.`);
  }
  let next: GameState = {
    ...state,
    camp: cloneCamp(state.camp),
    inventory: { ...state.inventory, extras: [...state.inventory.extras] },
  };
  next.camp!.jobs = next.camp!.jobs.filter((j) => j.id !== id);
  let text = "";
  if (job.kind === "dry-meat") {
    const gained = addToPack(next, "rations", 2);
    next = gained.state;
    if (!next.camp!.cache.extras.includes("jerky")) next.camp!.cache.extras.push("jerky");
    if (!next.inventory.extras.includes("jerky")) next.inventory.extras.push("jerky");
    text = withLeftoverNote(
      "You take the jerky off the rack. Stiff as a legal document. It will keep longer than wet meat.",
      gained.note,
    );
  } else if (job.kind === "bank-coals") {
    next.camp = addCampExtra(next.camp!, "banked-coals");
    if (!next.inventory.extras.includes("banked-coals")) next.inventory.extras.push("banked-coals");
    text = "You take the banked coals like coin. The next fire will be less of a beggar.";
  } else if (job.kind === "set-snares") {
    const rng = mulberry32(next.rngSeed);
    next.rngSeed = nextSeed(next.rngSeed);
    const meat = rng() < 0.55 ? 1 : 0;
    if (meat) {
      const gained = addToPack(next, "rations", 1);
      next = gained.state;
      text = withLeftoverNote(
        "The snare has done the ugly arithmetic. A hare, stiff, honest. You reset nothing; the job is collected.",
        gained.note,
      );
    } else {
      text = "Empty loops. A feather. The suggestion of a joke. You walk back to the ring.";
    }
  } else {
    if (!next.inventory.extras.includes("smoked-hide")) next.inventory.extras.push("smoked-hide");
    next.camp = addCampExtra(next.camp!, "smoked-hide");
    text = "The hide has taken the smoke. You roll it. Warmth is a smaller country and you have bought a corner.";
    if (next.presentCharacterId) {
      next.standing = { ...next.standing };
      next.standing[next.presentCharacterId] = (next.standing[next.presentCharacterId] ?? 0) + 1;
      text += " You could have gifted it. You keep it. They notice anyway.";
    }
  }
  next = appendLog(advanceTime(next, 1), text);
  return maybeRipple(next, "camp", 0.25);
}

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.dead) return state;
  if (state.waitScene && action.type !== "finishWait") return state;
  if (state.skirmish && action.type !== "skirmish") return state;
  if (state.pendingRoll) {
    const resumeType = state.pendingRoll.resume?.type;
    const allowed =
      action.type === "castDie" ||
      action.type === "finishDie" ||
      action.type === "cancelDie" ||
      action.type === "encounterChoice" ||
      (state.pendingRoll.d20 != null && resumeType != null && action.type === resumeType);
    if (!allowed) return state;
  }
  if (
    state.activeEncounterId &&
    action.type !== "encounterChoice" &&
    action.type !== "skirmish" &&
    action.type !== "castDie" &&
    action.type !== "finishDie" &&
    action.type !== "cancelDie"
  ) {
    if (getActiveEncounter(state)) return state;
    state = { ...state, activeEncounterId: null };
  }

  switch (action.type) {
    case "eat": {
      const spent = spendFromPackOrCache(state, "rations", 1);
      if (!spent) return appendLog(state, "The bag is empty. Your stomach is not.");
      let next: GameState = {
        ...spent,
        meters: { ...spent.meters, hunger: clamp(spent.meters.hunger + 22) },
      };
      next = appendLog(advanceTime(next, 1), eatCopy(state));
      if (timeBand(state.hour) === "dusk" && state.campfire) {
        const rng = mulberry32(next.rngSeed);
        next = { ...next, rngSeed: nextSeed(next.rngSeed) };
        if (rng() < 0.38 && !next.presentCharacterId) {
          const people = presentPeople(next);
          next.presentCharacterId = people.length
            ? people[Math.floor(rng() * people.length)]!.id
            : rng() < 0.55
              ? "silas-crowe"
              : null;
        }
        return maybeRipple(next, "eat", 0.4);
      }
      return maybeRipple(next, "eat", 0.28);
    }
    case "drink": {
      const spent = spendFromPackOrCache(state, "water", 1);
      if (!spent) return appendLog(state, "The canteen talks like a drum.");
      const next = {
        ...spent,
        meters: { ...spent.meters, thirst: clamp(spent.meters.thirst + 26) },
      };
      return maybeRipple(appendLog(advanceTime(next, 1), drinkCopy(state)), "drink", 0.22);
    }
    case "sleep":
      return sleep(state);
    case "makeFire": {
      if (state.inventory.firewood <= 0) return appendLog(state, "No wood. Rubbing your hands is not a fire.");
      const fatwood = state.inventory.extras.includes("fatwood");
      const bankedReady =
        (atOwnCamp(state) && state.camp?.cache.extras.includes("banked-coals")) ||
        state.inventory.extras.includes("banked-coals");
      if (state.weather === "blizzard" && !fatwood && !bankedReady) {
        return appendLog(state, "The blizzard eats the first spark and wants the rest.");
      }
      let next: GameState = {
        ...state,
        inventory: { ...state.inventory, firewood: state.inventory.firewood - 1, extras: [...state.inventory.extras] },
        campfire: true,
        campfireHours:
          (state.weather === "blizzard" ? 4 : 10) + (state.inventory.extras.includes("fire-drill") ? 2 : 0),
        meters: { ...state.meters, warmth: clamp(state.meters.warmth + (fatwood ? 38 : 28)) },
        camp: state.camp ? cloneCamp(state.camp) : state.camp,
      };
      const banked =
        atOwnCamp(next) &&
        (next.camp?.cache.extras.includes("banked-coals") || next.inventory.extras.includes("banked-coals"));
      if (banked) {
        next.meters.warmth = clamp(next.meters.warmth + 12);
        if (next.camp?.cache.extras.includes("banked-coals")) {
          next.camp = cloneCamp(next.camp);
          next.camp.cache.extras = next.camp.cache.extras.filter((e) => e !== "banked-coals");
        }
        next.inventory.extras = next.inventory.extras.filter((e) => e !== "banked-coals");
      }
      if (state.weather === "blizzard" && fatwood) {
        next.inventory.extras = next.inventory.extras.filter((e) => e !== "fatwood");
      }
      if (atOwnCamp(next) && next.camp) {
        next.camp = cloneCamp(next.camp);
        next.camp.smoke = Math.min(5, next.camp.smoke + 1);
      }
      next = appendLog(advanceTime(next, 1), fireCopy(state));
      if (timeBand(state.hour) === "dusk" || timeBand(state.hour) === "night" || state.weather === "blizzard") {
        const rng = mulberry32(next.rngSeed);
        next = { ...next, rngSeed: nextSeed(next.rngSeed) };
        if (rng() < 0.3 && !next.presentCharacterId) {
          const people = presentPeople(next);
          if (people.length) next.presentCharacterId = people[Math.floor(rng() * people.length)]!.id;
        }
      }
      next = maybeRipple(next, "fire", 0.34);
      return maybeSmokeRipple(next);
    }
    case "tendFire": {
      if (!state.campfire) return appendLog(state, "There is no fire to tend. Ash. Opinion.");
      const rng = mulberry32(state.rngSeed);
      const spend = state.inventory.firewood > 0 && rng() < 0.55;
      let next: GameState = {
        ...state,
        rngSeed: nextSeed(state.rngSeed),
        inventory: { ...state.inventory },
        meters: { ...state.meters },
        campfire: true,
        campfireHours: fireHoursLeft(state) + (spend ? 3 : 0),
      };
      if (spend) next.inventory.firewood = Math.max(0, next.inventory.firewood - 1);
      next.meters.warmth = clamp(next.meters.warmth + (spend ? 14 : 8));
      next = appendLog(advanceTime(next, 1), tendCopy(state));
      next = maybeRipple(next, "fire", 0.3);
      return maybeSmokeRipple(next);
    }
    case "gatherWater": {
      const loc = LOCATION_BY_ID[state.locationId];
      if (!loc?.tags.includes("water") && state.locationId !== "hot-spring" && state.locationId !== "creek") {
        return appendLog(state, "No water here that you would trust.");
      }
      const winterIce = state.season === "winter" || state.weather === "snow" || state.weather === "blizzard";
      if (winterIce) {
        const armed = armActionDie(state, "Chop a drinking hole", "hands", skilledDc(state, "ice", 12), { type: "gatherWater" });
        if (armed.kind === "armed") return armed.state;
        const roll = armed.roll;
        let next = appendLog(armed.state, rollLine(roll, "Ice"), roll);
        if (!roll.success) {
          next.meters = { ...next.meters, health: clamp(next.meters.health - 4), warmth: clamp(next.meters.warmth - 7) };
          next.inventory = {
            ...next.inventory,
            extras: next.inventory.extras.filter((e) => e !== "dry-boots"),
          };
          next = appendLog(advanceTime(next, 2), "The ice opens a mouth. You get out. Not all of the heat comes with you.");
          return next;
        }
        const gained = addToPack(next, "water", 2);
        next = gained.state;
        return appendLog(
          advanceTime(next, 2),
          withLeftoverNote("You take water from ice like a thief. Two canteens.", gained.note),
        );
      }
      const gained = addToPack(state, "water", 2);
      return maybeRipple(
        appendLog(
          advanceTime(gained.state, 1),
          withLeftoverNote("You fill the canteens. The water tastes of granite and luck.", gained.note),
        ),
        "drink",
        0.18,
      );
    }
    case "gatherWood": {
      const loc = LOCATION_BY_ID[state.locationId];
      if (!loc?.tags.includes("wood")) return appendLog(state, "This ground does not owe you timber.");
      if (state.season === "winter" || state.weather === "blizzard" || timeBand(state.hour) === "night") {
        const armed = armActionDie(state, "Break deadwood in the dark", "hands", skilledDc(state, "camp", 12), { type: "gatherWood" });
        if (armed.kind === "armed") return armed.state;
        const roll = armed.roll;
        let next = appendLog(armed.state, rollLine(roll, "Deadwood"), roll);
        const gain = roll.success ? 2 : 1;
        const gained = addToPack(next, "firewood", gain);
        next = gained.state;
        return appendLog(
          advanceTime(next, 2),
          withLeftoverNote(
            roll.success
              ? "You break frozen limbs until your shoulders argue. Two armfuls, paid in skin."
              : "Snow up to the elbow. One armful and a hatred of January.",
            gained.note,
          ),
        );
      }
      const gained = addToPack(state, "firewood", 2);
      return appendLog(
        advanceTime(gained.state, 2),
        withLeftoverNote("You break dead limbs until your shoulders argue. Two armfuls.", gained.note),
      );
    }
    case "wait":
      return beginWait(state);
    case "finishWait":
      return finishWait(state);
    case "restWatch": {
      const hours = 1 + (mulberry32(state.rngSeed)() < 0.4 ? 1 : 0);
      let next = advanceTime({ ...state, rngSeed: nextSeed(state.rngSeed) }, hours);
      if (next.dead) return appendLog(next, "You sit down. The mountain accepts the offering.");
      next = appendLog(next, restWatchCopy(next));
      return maybeRipple(next, "wait", 0.18);
    }
    case "search": {
      const hours = state.weather === "blizzard" ? 3 : 2;
      let next = advanceTime(state, hours);
      if (next.dead) return appendLog(next, "You search until the ground is the last thing that holds you.");
      if (state.weather === "blizzard") {
        next.meters = { ...next.meters, warmth: clamp(next.meters.warmth - 4), energy: clamp(next.meters.energy - 3) };
      }
      const enc = pickEncounter(next, "search");
      if (isUniqueStory(enc)) return beginEncounter(next, enc);
      return applyOutcome(next, forageOutcome(next));
    }
    case "hunt": {
      const loc = LOCATION_BY_ID[state.locationId];
      if (!loc?.tags.includes("game")) return appendLog(state, "This ground does not owe you a hunt.");
      if (state.weather === "blizzard") return appendLog(state, "In this white you would hunt only your own death.");
      const usedRifle = Boolean(state.inventory.rifle && state.inventory.powder > 0);
      const dc = skilledDc(
        state,
        "rifle",
        usedRifle ? (timeBand(state.hour) === "dusk" ? 13 : 12) : 13,
      );
      const armed = armActionDie(
        state,
        usedRifle ? "Take the shot" : "Still-hunt with the knife",
        usedRifle ? "eye" : "hands",
        dc,
        { type: "hunt" },
      );
      if (armed.kind === "armed") return armed.state;
      const roll = armed.roll;
      let next: GameState = usedRifle
        ? { ...armed.state, inventory: { ...armed.state.inventory, powder: armed.state.inventory.powder - 1 } }
        : armed.state;
      next = appendLog(next, rollLine(roll, usedRifle ? "Hunt" : "Still-hunt"), roll);
      const wound = !roll.success && roll.d20 <= 3;
      next = applyOutcome(next, {
        text:
          huntCopy(state, roll.success, usedRifle) +
          (wound ? " A branch, a fall, a red line on the shin." : ""),
        hours: 2,
        meters: roll.success
          ? { energy: -12 }
          : { energy: -12, health: wound ? -8 : 0 },
        inventory: roll.success ? { rations: usedRifle ? 2 : 1, pelts: roll.d20 >= 18 ? 1 : 0 } : undefined,
      });
      next = withPractice(next, "rifle", roll.success);
      return maybeRipple(next, "hunt", 0.36);
    }
    case "fish": {
      const allowed = new Set(["creek", "frozen-fall", "beaver-meadow", "hot-spring"]);
      if (!allowed.has(state.locationId)) return appendLog(state, "No water here that owes you a fish.");
      if (state.weather === "blizzard") return appendLog(state, "The blizzard has the bank.");
      const ice = state.season === "winter" || state.weather === "snow";
      const armed = armActionDie(
        state,
        ice ? "Cut a hole and fish" : "Fish the bank",
        "hands",
        skilledDc(state, "ice", ice ? 13 : 11),
        {
          type: "fish",
        },
      );
      if (armed.kind === "armed") return armed.state;
      const roll = armed.roll;
      let next = appendLog(armed.state, rollLine(roll, "Fish"), roll);
      const dunk = ice && !roll.success && roll.d20 <= 4;
      next = applyOutcome(next, {
        text: dunk
          ? `${fishCopy(state, false, true)} The ice opens a mouth.`
          : fishCopy(state, roll.success, ice),
        hours: 2,
        inventory: roll.success && !dunk ? { rations: 1 } : undefined,
        meters: dunk
          ? { health: -8, warmth: -14, energy: -8 }
          : { energy: -8, warmth: ice ? -10 : -2 },
      });
      next = withPractice(next, "ice", roll.success && !dunk);
      return maybeRipple(next, "fish", 0.3);
    }
    case "scout": {
      const night = timeBand(state.hour) === "night";
      const armed = armActionDie(
        state,
        night ? "Hold the watch" : "Scout the next bench",
        "savvy",
        skilledDc(state, "sign", night ? 13 : 12),
        {
          type: "scout",
        },
      );
      if (armed.kind === "armed") return armed.state;
      const roll = armed.roll;
      let next = appendLog(armed.state, rollLine(roll, night ? "Watch" : "Scout"), roll);
      const loc = LOCATION_BY_ID[state.locationId];
      const unknown = loc?.connections.filter((c) => !state.knownLocations.includes(c.to)) ?? [];
      const rng = mulberry32(next.rngSeed);
      next = { ...next, rngSeed: nextSeed(next.rngSeed) };
      const unlock = roll.success && unknown.length ? unknown[Math.floor(rng() * unknown.length)]!.to : undefined;
      let present: CharacterId | undefined;
      if (roll.success && rng() < 0.28) {
        const people = presentPeople(next);
        if (people.length) present = people[Math.floor(rng() * people.length)]!.id;
      }
      let weather: Weather | undefined;
      if (roll.success && (state.locationId === "wind-saddle" || state.locationId === "south-pass") && rng() < 0.3) {
        weather = state.season === "winter" ? "blizzard" : state.season === "summer" ? "storm" : "wind";
      }
      const named = unlock ? LOCATION_BY_ID[unlock]?.name ?? unlock : null;
      next = applyOutcome(next, {
        text: named
          ? `${scoutCopy(state, roll.success)} You can name ${named} from here.`
          : scoutCopy(state, roll.success),
        hours: night ? 1 : 2,
        meters: { energy: -8 },
        unlockLocation: unlock,
        presentCharacter: present,
        weather,
      });
      next = withPractice(next, "sign", roll.success);
      return maybeRipple(next, "scout", 0.38);
    }
    case "mend": {
      const rng = mulberry32(state.rngSeed);
      let next: GameState = {
        ...state,
        rngSeed: nextSeed(state.rngSeed),
        meters: { ...state.meters, energy: clamp(state.meters.energy - 4) },
        inventory: { ...state.inventory, extras: [...state.inventory.extras] },
      };
      const dry = rng() < 0.5 && (state.campfire || hasShelter(state));
      if (dry && !next.inventory.extras.includes("dry-boots")) next.inventory.extras.push("dry-boots");
      next = appendLog(advanceTime(next, 1), mendCopy(state, dry));
      return maybeRipple(next, "mend", 0.28);
    }
    case "checkSnares": {
      const rng = mulberry32(state.rngSeed);
      let next: GameState = { ...state, rngSeed: nextSeed(state.rngSeed) };
      const r = rng();
      const kind: "meat" | "empty" | "cut" = r < 0.38 ? "meat" : r < 0.52 ? "cut" : "empty";
      next.inventory = { ...next.inventory };
      next.meters = { ...next.meters, energy: clamp(next.meters.energy - 3) };
      let snareNote: string | null = null;
      if (kind === "meat") {
        const gained = addToPack(next, "rations", 1);
        next = gained.state;
        snareNote = gained.note;
      }
      next = appendLog(advanceTime(next, 2), withLeftoverNote(snaresCopy(state, kind), snareNote));
      return maybeRipple(next, "snares", kind === "cut" ? 0.7 : 0.28);
    }
    case "cache": {
      if (state.inventory.rations < 2) return appendLog(state, "You do not have meat to spare.");
      const where =
        state.locationId === "cache-deadfall"
          ? "deadfall"
          : state.locationId === "talus-ice-cave"
            ? "ice"
            : "camp";
      const extra = where === "deadfall" ? "deadfall-ticket" : where === "ice" ? "ice-cache" : "camp-cache";
      let next: GameState = {
        ...state,
        inventory: {
          ...state.inventory,
          rations: state.inventory.rations - 2,
          extras: [...state.inventory.extras],
        },
      };
      if (!next.inventory.extras.includes(extra)) next.inventory.extras.push(extra);
      next = appendLog(advanceTime(next, 1), cacheCopy(state, where));
      return maybeRipple(next, "camp", 0.2);
    }
    case "shelterUp": {
      let next: GameState = {
        ...state,
        inventory: { ...state.inventory, extras: [...state.inventory.extras] },
        meters: {
          ...state.meters,
          energy: clamp(state.meters.energy - 6),
          warmth: clamp(state.meters.warmth + 14),
        },
      };
      if (!next.inventory.extras.includes("snow-hole")) next.inventory.extras.push("snow-hole");
      next = appendLog(advanceTime(next, 2), shelterCopy(state));
      return maybeRipple(next, "shelter", 0.3);
    }
    case "pray": {
      const person = state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : null;
      let next: GameState = { ...state, standing: { ...state.standing } };
      if (person) next.standing[person.id] = (next.standing[person.id] ?? 0) + 1;
      next = appendLog(advanceTime(next, 1), prayCopy(state, person?.name ?? null));
      return maybeRipple(next, "pray", 0.4);
    }
    case "talk":
      return talk(state);
    case "travel":
      return travel(state, action.to);
    case "encounterChoice":
      return resolveEncounterChoice(state, action.optionId);
    case "castDie":
      return castPendingDie(state);
    case "finishDie":
      return finishPendingDie(state);
    case "cancelDie":
      return { ...state, pendingRoll: null };
    case "skirmish":
      return resolveSkirmish(state, action.move);
    case "pitchCamp":
      return pitchCamp(state);
    case "strikeCamp":
      return strikeCamp(state);
    case "build":
      return buildPiece(state, action.piece);
    case "stow":
      return stowItem(state, action.item, action.amount ?? 1);
    case "takeFromCache":
      return takeFromCache(state, action.item, action.amount ?? 1);
    case "cook":
      return cookAtCamp(state);
    case "startJob":
      return startCampJob(state, action.kind);
    case "collectJob":
      return collectCampJob(state, action.id);
    case "sewBag":
      return sewHideBag(state);
    case "expandCache":
      return expandCache(state);
    case "partWays":
      return partWays(state);
  }
}

function asHero(choice: Choice): Choice {
  return { ...choice, tier: "hero" };
}

export function getChoices(state: GameState): Choice[] {
  if (state.dead) return [];
  if (state.waitScene) return [];
  if (state.skirmish) {
    return [
      asHero({ id: "fire", label: "Aim / fire", hint: "Eye, costs powder", action: { type: "skirmish", move: "fire" } }),
      asHero({ id: "close", label: "Close / knife", hint: "Hands", action: { type: "skirmish", move: "close" } }),
      asHero({ id: "cover", label: "Take cover", action: { type: "skirmish", move: "cover" } }),
      asHero({ id: "item", label: "Use ration or water", action: { type: "skirmish", move: "item" } }),
      asHero({ id: "flee", label: "Flee", hint: "Grit", action: { type: "skirmish", move: "flee" } }),
    ];
  }
  if (state.pendingRoll) {
    const enc = getActiveEncounter(state);
    const retreats: Choice[] =
      enc?.choices
        .filter((c) => !c.check)
        .map((c) => {
          const afford = choiceAffordable(state, c);
          return asHero({
            id: c.id,
            label: c.label,
            disabled: !afford,
            hint: "Leave the die on the table",
            action: { type: "encounterChoice" as const, optionId: c.id },
          });
        }) ?? [];
    if (state.pendingRoll.resume) {
      retreats.push(
        asHero({
          id: "cancel-die",
          label: "Let it go",
          disabled: false,
          hint: "Leave the die on the table",
          action: { type: "cancelDie" as const },
        }),
      );
    }
    return retreats;
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
      return asHero({
        id: c.id,
        label: c.label,
        disabled: !afford,
        hint: c.check
          ? isDramaticCheck(enc, c)
            ? `Roll the die · ${c.check.trait} vs ${c.check.dc}`
            : `d20 + ${c.check.trait} vs ${c.check.dc}`
          : costHint,
        action: { type: "encounterChoice" as const, optionId: c.id },
      });
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
