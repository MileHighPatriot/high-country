import { CHARACTER_BY_ID, CHARACTERS } from "@/lib/game/content/characters";
import { allEncounters, choreEncounter } from "@/lib/game/content/index";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
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
    hunger: 2,
    thirst: 3,
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
  let cause: DeathCause | null = null;
  if (meters.hunger <= 0) {
    bite += 6;
    cause = "starvation";
  }
  if (meters.thirst <= 0) {
    bite += 8;
    cause = "thirst";
  }
  if (meters.warmth <= 0) {
    bite += 8;
    cause = "exposure";
  }
  if (meters.energy <= 0) {
    bite += 4;
    cause = "exhaustion";
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
  return { ...state, log: [...state.log.slice(-8), entry] };
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

function applyOutcome(state: GameState, outcome: Outcome): GameState {
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
  if (outcome.startSkirmish) {
    next.skirmish = {
      ...outcome.startSkirmish,
      foes: outcome.startSkirmish.foes.map((f) => ({ ...f })),
      playerCover: false,
      awaiting: "player",
    };
    next.activeEncounterId = null;
  }
  next = appendLog(next, outcome.text);
  if (outcome.death) {
    next.dead = {
      cause: outcome.death.cause,
      detail: outcome.death.detail,
      daysSurvived: next.daysSurvived,
      season: next.season,
    };
  }
  next = finalizeHealth(next);
  return next;
}

function finalizeHealth(state: GameState): GameState {
  if (state.dead) return state;
  const meters = { ...state.meters };
  const cause = decayHealth(meters);
  if (meters.health <= 0) {
    return {
      ...state,
      meters,
      dead: {
        cause: cause ?? "sickness",
        detail: deathCopy(cause ?? "sickness"),
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

export function advanceTime(state: GameState, hours: number): GameState {
  let next = { ...state, meters: { ...state.meters } };
  for (let i = 0; i < hours; i++) {
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
      next.weather = pickWeather(next.season, rng);
      next.rngSeed = nextSeed(next.rngSeed);
      if (next.weather === "blizzard") next.campfire = false;
    }
    if (next.hour === 12 && next.weather !== "blizzard") {
      const rng = mulberry32(next.rngSeed + next.hour);
      if (rng() < 0.22) next.weather = pickWeather(next.season, rng);
      next.rngSeed = nextSeed(next.rngSeed);
    }
  }
  return finalizeHealth(next);
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
  const weights = pool.map((e) => e.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let n = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    n -= weights[i]!;
    if (n <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function beginEncounter(state: GameState, enc: EncounterDef): GameState {
  const seen = state.seenEncounterIds.includes(enc.id)
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
    rations: 3,
    water: 2,
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
    dead: null,
    rngSeed: seed,
  };
  return appendLog(
    state,
    `${state.name} wakes in a lean-to that leaked all night. Late spring, 1835, too high on the Front Range. The pass is still a white lie. There is no town coming. Eat. Drink. Keep a fire. Do not die.`,
  );
}

function resolveEncounterChoice(state: GameState, optionId: string): GameState {
  const enc =
    allEncounters().find((e) => e.id === state.activeEncounterId) ??
    (state.activeEncounterId?.startsWith("dlg-")
      ? findDialogueEncounter(state)
      : undefined) ??
    (state.activeEncounterId?.startsWith("chore-")
      ? choreEncounter(state, "wait")
      : undefined);
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
  let next: GameState = { ...state, campfire: false, presentCharacterId: null, activeEncounterId: null };
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
  if (next.weather === "blizzard" && Math.random() < 0.15) {
    return applyOutcome(next, {
      text: "In the white, the ground drops. You find it with your ribs.",
      meters: { health: -14, energy: -10 },
      hours: 1,
    });
  }
  const enc = pickEncounter(next, "arrive");
  if (!enc.id.startsWith("chore-") && mulberry32(next.rngSeed)() < 0.72) {
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
  next.meters = { ...next.meters };
  next.meters.energy = clamp(next.meters.energy + (fire || shelter ? 55 : 25));
  if (fire || shelter) next.meters.warmth = clamp(next.meters.warmth + 20);
  else next.meters.warmth = clamp(next.meters.warmth - 10);
  if (state.weather === "blizzard" && !shelter && !fire) {
    next.meters.warmth = clamp(next.meters.warmth - 25);
    next.meters.health = clamp(next.meters.health - 8);
  }
  next.campfire = fire && shelter;
  next.presentCharacterId = null;
  next.activeEncounterId = null;
  next = appendLog(
    next,
    fire || shelter
      ? "You sleep in what passes for safety. Dawn is not kinder, only later."
      : "You sleep in the open. The stars are very clear. That is not a comfort.",
  );
  return finalizeHealth(next);
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
          const dmg = 4 + Math.floor(mulberry32(next.rngSeed)() * 6);
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
  if (state.activeEncounterId && action.type !== "encounterChoice") {
    if (action.type !== "skirmish") return state;
  }

  switch (action.type) {
    case "eat": {
      if (state.inventory.rations <= 0) return appendLog(state, "The bag is empty. Your stomach is not.");
      const next = {
        ...state,
        inventory: { ...state.inventory, rations: state.inventory.rations - 1 },
        meters: { ...state.meters, hunger: clamp(state.meters.hunger + 36) },
      };
      return appendLog(advanceTime(next, 1), "You eat. It is not a meal. It is a postponement.");
    }
    case "drink": {
      if (state.inventory.water <= 0) return appendLog(state, "The canteen talks like a drum.");
      const next = {
        ...state,
        inventory: { ...state.inventory, water: state.inventory.water - 1 },
        meters: { ...state.meters, thirst: clamp(state.meters.thirst + 42) },
      };
      return appendLog(advanceTime(next, 1), "You drink. For a minute the world is simple.");
    }
    case "sleep":
      return sleep(state);
    case "makeFire": {
      if (state.inventory.firewood <= 0) return appendLog(state, "No wood. Rubbing your hands is not a fire.");
      if (state.weather === "blizzard") return appendLog(state, "The blizzard eats the first spark and wants the rest.");
      const next = {
        ...state,
        inventory: { ...state.inventory, firewood: state.inventory.firewood - 1 },
        campfire: true,
        meters: { ...state.meters, warmth: clamp(state.meters.warmth + 28) },
      };
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
          next.meters = { ...next.meters, health: clamp(next.meters.health - 10), warmth: clamp(next.meters.warmth - 18) };
          next = appendLog(advanceTime(next, 2), "The ice opens a mouth. You get out. Not all of the heat comes with you.");
          return finalizeHealth(next);
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
      const next = {
        ...state,
        inventory: { ...state.inventory, firewood: state.inventory.firewood + 2 },
      };
      return appendLog(advanceTime(next, 2), "You break dead limbs until your shoulders argue. Two armfuls.");
    }
    case "wait": {
      let next = advanceTime(state, 3);
      next = appendLog(next, "You wait. Weather is a conversation you are losing.");
      const enc = pickEncounter(next, "wait");
      if (!enc.id.startsWith("chore-")) return beginEncounter(next, enc);
      return next;
    }
    case "search": {
      let next = advanceTime(state, 2);
      const enc = pickEncounter(next, "search");
      next = appendLog(next, "You search the ground like it owes you a living.");
      return beginEncounter(next, enc);
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
    const enc =
      allEncounters().find((e) => e.id === state.activeEncounterId) ??
      (state.activeEncounterId.startsWith("dlg-")
        ? findDialogueEncounter(state)
        : state.activeEncounterId.startsWith("chore-")
          ? choreEncounter(state, "search")
          : undefined);
    if (!enc) return campChoices(state);
    return enc.choices.map((c) => ({
      id: c.id,
      label: c.label,
      hint: c.check ? `d20 + ${c.check.trait} vs ${c.check.dc}` : undefined,
      action: { type: "encounterChoice", optionId: c.id },
    }));
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
      disabled: state.inventory.firewood <= 0 || state.weather === "blizzard" || state.campfire,
      hint: state.campfire ? "Already burning" : undefined,
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
  return {
    location: loc?.art ?? "/art/locations/high-camp.jpg",
    portrait: person?.art ?? state.skirmish?.foes[0]?.art ?? null,
    atmosphere,
  };
}
