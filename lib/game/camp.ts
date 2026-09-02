import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  CampCache,
  CampJob,
  CampJobKind,
  CampPiece,
  CampSite,
  CampStowItem,
  Choice,
  GameState,
  Inventory,
  LocationId,
} from "@/lib/game/types";
import { PACK_LIMITS, timeBand } from "@/lib/game/types";

export const PITCHABLE = new Set<LocationId>([
  "high-camp",
  "timberline",
  "creek",
  "beaver-meadow",
  "burned-timber",
  "lightning-pine",
  "cache-deadfall",
  "elk-wallow",
  "wind-saddle",
  "grizzly-basin",
  "avalanche-chute",
  "south-park-rim",
]);

export const CLAIMED_GROUND = new Set<LocationId>([
  "ute-camp",
  "arapaho-ground",
  "mexican-trail-camp",
  "abandoned-cabin",
  "homesteader-ruin",
]);

export const CACHE_CAPS: Record<CampStowItem, number> = {
  rations: 16,
  water: 10,
  firewood: 8,
  pelts: 10,
  powder: 12,
};

export const ROCK_RATION_CAP = 2;
export const WOODPILE_FIREWOOD_CAP = 12;
export const NO_WOODPILE_FIREWOOD_CAP = 8;

export const WANDERERS = ["silas-crowe", "ned-calhoun", "peggy-dunne", "jean-baptiste"] as const;

export function emptyCache(): CampCache {
  return { rations: 0, water: 0, firewood: 0, pelts: 0, powder: 0, extras: [] };
}

export function emptyCamp(locationId: LocationId, opts: Partial<CampSite> = {}): CampSite {
  const cache = opts.cache ? { ...opts.cache, extras: [...(opts.cache.extras ?? [])] } : emptyCache();
  return {
    locationId,
    leanTo: opts.leanTo ?? false,
    fireRing: opts.fireRing ?? false,
    woodpile: opts.woodpile ?? false,
    cachePit: opts.cachePit ?? false,
    dryingRack: opts.dryingRack ?? false,
    pot: opts.pot ?? false,
    cache,
    jobs: opts.jobs?.map((j) => ({ ...j })) ?? [],
    smoke: opts.smoke ?? 0,
  };
}

export function cloneCamp(camp: CampSite): CampSite {
  return {
    ...camp,
    cache: { ...camp.cache, extras: [...camp.cache.extras] },
    jobs: camp.jobs.map((j) => ({ ...j })),
  };
}

export function atOwnCamp(state: GameState): boolean {
  return Boolean(state.camp && state.camp.locationId === state.locationId);
}

export function canPitch(state: GameState): boolean {
  if (state.camp) return false;
  if (CLAIMED_GROUND.has(state.locationId)) return false;
  return PITCHABLE.has(state.locationId);
}

export function firewoodCap(camp: CampSite): number {
  return camp.woodpile ? WOODPILE_FIREWOOD_CAP : NO_WOODPILE_FIREWOOD_CAP;
}

export function cacheCap(camp: CampSite, item: CampStowItem): number {
  if (!camp.cachePit) {
    return item === "rations" ? ROCK_RATION_CAP : 0;
  }
  if (item === "firewood") return firewoodCap(camp);
  return CACHE_CAPS[item];
}

export function packRoom(inv: Inventory, item: CampStowItem): number {
  return Math.max(0, PACK_LIMITS[item] - inv[item]);
}

export function packLeftover(
  inv: Inventory,
  cache: CampCache,
): { inv: Inventory; cache: CampCache; leftBehind: boolean } {
  const nextInv: Inventory = { ...inv, extras: [...inv.extras] };
  const nextCache: CampCache = { ...cache, extras: [...cache.extras] };
  let leftBehind = false;
  (Object.keys(PACK_LIMITS) as CampStowItem[]).forEach((item) => {
    const room = packRoom(nextInv, item);
    const take = Math.min(room, nextCache[item]);
    nextInv[item] += take;
    nextCache[item] -= take;
    if (nextCache[item] > 0) leftBehind = true;
  });
  for (const extra of nextCache.extras) {
    if (!nextInv.extras.includes(extra)) nextInv.extras.push(extra);
  }
  nextCache.extras = [];
  return { inv: nextInv, cache: nextCache, leftBehind };
}

export function spendFromPackOrCache(
  state: GameState,
  item: CampStowItem,
  amount: number,
): GameState | null {
  const pack = state.inventory[item];
  const cacheAmt = atOwnCamp(state) ? state.camp!.cache[item] : 0;
  if (pack + cacheAmt < amount) return null;
  const inventory = { ...state.inventory, extras: [...state.inventory.extras] };
  let need = amount;
  const fromPack = Math.min(pack, need);
  inventory[item] = pack - fromPack;
  need -= fromPack;
  let camp = state.camp ? cloneCamp(state.camp) : state.camp;
  if (need > 0 && camp) {
    camp.cache[item] -= need;
  }
  return { ...state, inventory, camp: camp ?? null };
}

export function addCampExtra(camp: CampSite, extra: string): CampSite {
  if (camp.cache.extras.includes(extra)) return camp;
  const next = cloneCamp(camp);
  next.cache.extras.push(extra);
  return next;
}

export function removeCampExtra(camp: CampSite, extra: string): CampSite {
  const next = cloneCamp(camp);
  next.cache.extras = next.cache.extras.filter((e) => e !== extra);
  return next;
}

export function jobLabel(kind: CampJobKind, ready = false): string {
  if (ready) {
    return {
      "dry-meat": "Take the jerky off the rack",
      "bank-coals": "Take the banked coals",
      "set-snares": "Walk the snare line",
      "smoke-hide": "Take the smoked hide",
    }[kind];
  }
  return {
    "dry-meat": "Hang meat to dry",
    "bank-coals": "Bank coals under ash",
    "set-snares": "Set snares off camp",
    "smoke-hide": "Smoke a hide",
  }[kind];
}

export function jobHours(kind: CampJobKind): number {
  return { "dry-meat": 16, "bank-coals": 8, "set-snares": 12, "smoke-hide": 20 }[kind];
}

export function readyJobs(camp: CampSite | null | undefined): CampJob[] {
  return camp?.jobs.filter((j) => j.hoursLeft <= 0) ?? [];
}

export function campHasJob(camp: CampSite, kind: CampJobKind): boolean {
  return camp.jobs.some((j) => j.kind === kind);
}

export function readyJobLine(camp: CampSite | null | undefined): string | null {
  const ready = readyJobs(camp);
  if (!ready.length) return null;
  const bits = ready.map((j) => {
    if (j.kind === "dry-meat") return "the rack is done — jerky if the ravens have not voted";
    if (j.kind === "bank-coals") return "coals wait under ash, still useful";
    if (j.kind === "set-snares") return "the snare line has had its hours";
    return "a hide has taken the smoke";
  });
  if (bits.length === 1) return `Your camp kept working. ${bits[0]}.`;
  return `Your camp kept working. ${bits.join("; ")}.`;
}

export function tickCampHour(
  camp: CampSite,
  opts: { fireAtCamp: boolean; blizzard: boolean; newDay: boolean; atCamp: boolean; rng: () => number },
): { camp: CampSite; notes: string[] } {
  const next = cloneCamp(camp);
  const notes: string[] = [];
  const alreadyReady = new Set(next.jobs.filter((j) => j.hoursLeft <= 0).map((j) => j.id));
  next.jobs = next.jobs.map((j) => {
    if (j.hoursLeft <= 0) return j;
    return { ...j, hoursLeft: Math.max(0, j.hoursLeft - 1) };
  });
  if (opts.fireAtCamp) {
    next.smoke = Math.min(5, next.smoke + 1);
  } else {
    const decay = opts.blizzard ? 2 : 1;
    next.smoke = Math.max(0, next.smoke - decay);
  }
  if (opts.newDay) {
    next.jobs = next.jobs.filter((j) => {
      if (j.kind === "dry-meat" && j.hoursLeft <= 0 && alreadyReady.has(j.id) && opts.rng() < 0.2) {
        notes.push("ravens");
        return false;
      }
      return true;
    });
    if (!next.cachePit && next.cache.rations > 0 && !opts.atCamp && opts.rng() < 0.35) {
      next.cache.rations = 0;
      notes.push("rock-theft");
      if (!next.cache.extras.includes("rock-theft")) next.cache.extras.push("rock-theft");
    }
  }
  return { camp: next, notes };
}

export function canCook(state: GameState): { ok: boolean; good: boolean; reason?: string } {
  if (!atOwnCamp(state) || !state.camp) return { ok: false, good: false, reason: "No camp here." };
  const ration = state.inventory.rations + state.camp.cache.rations;
  const water = state.inventory.water + state.camp.cache.water;
  if (ration < 1) return { ok: false, good: false, reason: "No meat to cook." };
  if (water < 1) return { ok: false, good: false, reason: "No water for the pot." };
  const wood = state.inventory.firewood + state.camp.cache.firewood;
  const fire = state.campfire || (state.camp.fireRing && wood >= 1);
  if (!fire) return { ok: false, good: false, reason: "Need a fire, or a ring and wood." };
  const good =
    state.camp.pot ||
    state.inventory.extras.includes("tin-pot") ||
    state.camp.cache.extras.includes("tin-pot");
  return { ok: true, good };
}

export function canStartJob(
  state: GameState,
  kind: CampJobKind,
): { ok: boolean; reason?: string } {
  if (!atOwnCamp(state) || !state.camp) return { ok: false, reason: "No camp here." };
  if (campHasJob(state.camp, kind)) return { ok: false, reason: "That work is already going." };
  if (kind === "dry-meat") {
    if (!state.camp.dryingRack) return { ok: false, reason: "Need a drying rack." };
    const meat = state.inventory.rations + state.camp.cache.rations;
    if (meat < 2) return { ok: false, reason: "Need two rations to hang." };
    return { ok: true };
  }
  if (kind === "bank-coals") {
    if (!state.campfire && !state.camp.fireRing) return { ok: false, reason: "Need a fire." };
    return { ok: true };
  }
  if (kind === "set-snares") {
    const loc = LOCATION_BY_ID[state.camp.locationId];
    if (!loc?.tags.includes("game")) return { ok: false, reason: "This ground does not hold snares." };
    return { ok: true };
  }
  const pelts = state.inventory.pelts + state.camp.cache.pelts;
  if (pelts < 1) return { ok: false, reason: "Need a pelt." };
  if (!state.campfire && !state.camp.fireRing) return { ok: false, reason: "Need a fire to smoke a hide." };
  return { ok: true };
}

export function buildHours(piece: CampPiece): number {
  if (piece === "leanTo") return 3;
  if (piece === "cachePit" || piece === "dryingRack") return 1;
  return 2;
}

export function stowLabel(item: CampStowItem, pit: boolean): string {
  if (item === "rations") return pit ? "Stow meat in the pit" : "Leave meat on the rock";
  if (item === "water") return pit ? "Stow water in the pit" : "Leave water at camp";
  if (item === "firewood") return "Stack wood on the pile";
  if (item === "pelts") return "Stow pelts in the cache";
  return "Stow powder in the pit";
}

export function takeLabel(item: CampStowItem): string {
  if (item === "rations") return "Take meat from camp";
  if (item === "water") return "Take water from camp";
  if (item === "firewood") return "Take wood from camp";
  if (item === "pelts") return "Take pelts from camp";
  return "Take powder from camp";
}

export function buildLabel(piece: CampPiece): string {
  return {
    leanTo: "Raise a lean-to",
    fireRing: "Stack a ring of stone",
    woodpile: "Build a woodpile",
    cachePit: "Dig a cache pit",
    dryingRack: "Raise a drying rack",
    pot: "Rig a pot",
  }[piece];
}

function storageActs(state: GameState, rng: () => number): Choice[] {
  if (!atOwnCamp(state) || !state.camp) return [];
  const camp = state.camp;
  const items: CampStowItem[] = ["rations", "water", "firewood", "pelts", "powder"];
  const stows: Choice[] = [];
  const takes: Choice[] = [];
  for (const item of items) {
    const cap = cacheCap(camp, item);
    if (state.inventory[item] > 0 && camp.cache[item] < cap && cap > 0) {
      stows.push({
        id: `stow-${item}`,
        label: stowLabel(item, camp.cachePit),
        hint: `${state.inventory[item]} in pack`,
        action: { type: "stow", item },
      });
    }
    if (camp.cache[item] > 0 && packRoom(state.inventory, item) > 0) {
      takes.push({
        id: `take-${item}`,
        label: takeLabel(item),
        hint: `${camp.cache[item]} in cache`,
        action: { type: "takeFromCache", item },
      });
    }
  }
  const out: Choice[] = [];
  if (stows.length) out.push(stows[Math.floor(rng() * stows.length)]!);
  if (takes.length) out.push(takes[Math.floor(rng() * takes.length)]!);
  return out;
}

/**
 * Site verbs for the play-screen hotspots. Stable ids.
 */
export function campHotspots(state: GameState): Choice[] {
  const spots: Choice[] = [];
  if (state.dead || state.skirmish || state.activeEncounterId) return spots;

  if (!state.camp && canPitch(state)) {
    spots.push({
      id: "camp-pitch",
      label: timeBand(state.hour) === "dusk" ? "Claim this bench" : "Pitch a camp",
      action: { type: "pitchCamp" },
    });
    return spots;
  }

  if (!atOwnCamp(state) || !state.camp) return spots;
  const camp = state.camp;
  const seed =
    (state.rngSeed + state.dayOfYear * 1009 + state.hour * 17 + state.locationId.length * 13) >>> 0;
  const rng = () => {
    // local mulberry; hotspot set should be stable for the hour
    return ((seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  };

  if (!camp.leanTo) {
    spots.push({
      id: "camp-lean",
      label: buildLabel("leanTo"),
      hint: "2 wood · Hands",
      action: { type: "build", piece: "leanTo" },
    });
  }
  if (camp.fireRing || state.campfire) {
    const cook = canCook(state);
    if (cook.ok) {
      spots.push({
        id: "camp-fire",
        label: cook.good ? "Cook a pot" : "Cook over bark",
        hint: cook.good ? "1 hour" : "Worse without a pot",
        action: { type: "cook" },
      });
    } else if (state.campfire) {
      spots.push({
        id: "camp-fire",
        label: "Sit by the fire",
        action: { type: "tendFire" },
      });
    }
  } else {
    spots.push({
      id: "camp-fire",
      label: buildLabel("fireRing"),
      action: { type: "build", piece: "fireRing" },
    });
  }
  if (!camp.woodpile) {
    spots.push({
      id: "camp-wood",
      label: buildLabel("woodpile"),
      hint: "1 wood",
      action: { type: "build", piece: "woodpile" },
    });
  } else if (state.inventory.firewood > 0 && camp.cache.firewood < firewoodCap(camp)) {
    spots.push({
      id: "camp-wood",
      label: "Stack wood on the pile",
      action: { type: "stow", item: "firewood" },
    });
  }
  const cacheActs = storageActs(state, rng);
  const cacheChoice =
    cacheActs.find((c) => c.action.type === "stow" && c.action.item === "rations") ??
    cacheActs.find((c) => c.action.type === "takeFromCache" && c.action.item === "water") ??
    cacheActs[0];
  if (cacheChoice) {
    spots.push({
      id: "camp-cache",
      label: cacheChoice.label,
      hint: cacheChoice.hint,
      action: cacheChoice.action,
    });
  } else if (!camp.cachePit) {
    spots.push({
      id: "camp-cache",
      label: buildLabel("cachePit"),
      hint: state.season === "winter" ? "Hands 11" : "1 hour",
      action: { type: "build", piece: "cachePit" },
    });
  }
  if (!camp.dryingRack) {
    spots.push({
      id: "camp-rack",
      label: buildLabel("dryingRack"),
      hint: "1 wood",
      action: { type: "build", piece: "dryingRack" },
    });
  } else {
    const dry = camp.jobs.find((j) => j.kind === "dry-meat");
    if (dry && dry.hoursLeft <= 0) {
      spots.push({
        id: "camp-rack",
        label: jobLabel("dry-meat", true),
        action: { type: "collectJob", id: dry.id },
      });
    } else if (!dry && canStartJob(state, "dry-meat").ok) {
      spots.push({
        id: "camp-rack",
        label: jobLabel("dry-meat"),
        hint: "2 rations · 16 hours",
        action: { type: "startJob", kind: "dry-meat" },
      });
    }
  }
  if (!camp.pot && !state.inventory.extras.includes("tin-pot")) {
    spots.push({
      id: "camp-pot",
      label: buildLabel("pot"),
      hint: "tin pot or 2 pelts",
      action: { type: "build", piece: "pot" },
    });
  } else if (canCook(state).ok && !spots.some((s) => s.id === "camp-fire")) {
    spots.push({
      id: "camp-pot",
      label: "Cook a pot",
      action: { type: "cook" },
    });
  }
  spots.push({
    id: "camp-strike",
    label: "Strike camp",
    hint: "2 hours · pack what fits",
    action: { type: "strikeCamp" },
  });
  return spots;
}

export function campMenuChoices(state: GameState, rng: () => number): { must: Choice[]; good: Choice[]; flavor: Choice[] } {
  const must: Choice[] = [];
  const good: Choice[] = [];
  const flavor: Choice[] = [];
  const band = timeBand(state.hour);

  if (!state.camp && canPitch(state)) {
    const pitch: Choice = {
      id: "camp-pitch",
      label: rng() < 0.5 ? "Pitch a camp" : "Claim this bench",
      action: { type: "pitchCamp" },
    };
    if (band === "dusk" || band === "night" || state.weather === "blizzard") must.push(pitch);
    else if (rng() < 0.7) good.push(pitch);
    return { must, good, flavor };
  }

  if (!atOwnCamp(state) || !state.camp) return { must, good, flavor };
  const camp = state.camp;

  for (const job of readyJobs(camp)) {
    must.push({
      id: `collect-${job.id}`,
      label: jobLabel(job.kind, true),
      action: { type: "collectJob", id: job.id },
    });
  }

  const cook = canCook(state);
  if (cook.ok && rng() < 0.55) {
    const c: Choice = {
      id: "cook",
      label: cook.good ? "Cook a pot" : "Cook over bark",
      hint: "1 hour",
      action: { type: "cook" },
    };
    if (state.meters.hunger < 40) must.push(c);
    else good.push(c);
  }

  const pieces: CampPiece[] = ["leanTo", "fireRing", "woodpile", "cachePit", "dryingRack", "pot"];
  const lacking = pieces.filter((p) => !camp[p]);
  if (lacking.length && rng() < 0.6) {
    const piece = lacking[Math.floor(rng() * lacking.length)]!;
    good.push({
      id: `build-${piece}`,
      label: buildLabel(piece),
      hint: piece === "cachePit" && state.season === "winter" ? "Hands 11" : `${buildHours(piece)} hours`,
      action: { type: "build", piece },
    });
  }

  const acts = storageActs(state, rng);
  for (const a of acts.slice(0, 2)) {
    if (rng() < 0.75) good.push(a);
  }

  const jobs: CampJobKind[] = ["dry-meat", "bank-coals", "set-snares", "smoke-hide"];
  for (const kind of jobs) {
    if (campHasJob(camp, kind)) continue;
    const can = canStartJob(state, kind);
    if (!can.ok) continue;
    if (rng() < 0.4) {
      good.push({
        id: `job-${kind}`,
        label: jobLabel(kind),
        hint: `${jobHours(kind)} hours`,
        action: { type: "startJob", kind },
      });
    }
  }

  const strike: Choice = {
    id: "camp-strike",
    label: "Strike camp",
    hint: "Pull the stakes",
    action: { type: "strikeCamp" },
  };
  if (band === "dusk" && rng() < 0.45) flavor.push(strike);
  else if (band === "night" && rng() < 0.25) flavor.push(strike);
  else if (rng() < 0.12) flavor.push(strike);

  return { must, good, flavor };
}

export function recoverOnStrike(camp: CampSite, inv: Inventory): { inv: Inventory; note: string } {
  const next: Inventory = { ...inv, extras: [...inv.extras] };
  const notes: string[] = [];
  for (const job of camp.jobs) {
    if (job.kind === "dry-meat") {
      if (job.hoursLeft <= 0) {
        const room = packRoom(next, "rations");
        const take = Math.min(1, room);
        next.rations += take;
        notes.push(take ? "half the jerky comes with you" : "the jerky stays for ravens");
      } else {
        notes.push("the hanging meat is lost");
      }
    } else if (job.kind === "smoke-hide" && job.hoursLeft <= 0) {
      if (!next.extras.includes("smoked-hide")) next.extras.push("smoked-hide");
      notes.push("you roll the smoked hide");
    } else if (job.kind === "bank-coals") {
      notes.push("the banked coals go cold");
    } else if (job.kind === "set-snares") {
      notes.push("the snares are abandoned");
    }
  }
  const note = notes.length ? notes.join("; ") : "the work of the place is cancelled";
  return { inv: next, note };
}
