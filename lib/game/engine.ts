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
import { interpretAttempt, shouldDispatchVerb } from "@/lib/game/attempt";
import { attemptOutcome, followUpScene, rememberStory } from "@/lib/game/improv";
import {
  chopBonus,
  craftTool,
  finishRaise,
  hasTool,
  maybeWreckHomestead,
  startRaise,
  stoneGround,
  workById,
} from "@/lib/game/homestead";
import { isLiveTalk, liveTalkEncounter } from "@/lib/game/talk";
import { peopleAt, placePerson, seedWorld, syncPresence, tickWorldHour } from "@/lib/game/world";
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
