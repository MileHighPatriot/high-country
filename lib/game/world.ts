import { WANDERERS } from "@/lib/game/camp";
import { CHARACTERS, CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID, LOCATIONS } from "@/lib/game/content/locations";
import type {
  CharacterId,
  GameState,
  LocationId,
  PersonLife,
  PersonMood,
  PersonNeed,
  WorldState,
} from "@/lib/game/types";

const NEEDS: PersonNeed[] = ["food", "warmth", "trade", "shelter", "news", "company"];
const MOODS: PersonMood[] = ["even", "wary", "friendly", "desperate", "angry"];

const ERRAND: Record<PersonNeed, string[]> = {
  food: ["after meat", "checking snares", "following a blood trail that already went cold"],
  warmth: ["looking for a stove", "wanting a fire that is not theirs", "out of wood and admitting it"],
  trade: ["carrying a pack to trade", "looking for powder or flour", "asking who still has pelts"],
  shelter: ["wanting a roof", "the wind has been chewing them", "looking for a wall that holds"],
  news: ["asking who has been through", "carrying a name down the trail", "listening more than talking"],
  company: ["following smoke", "tired of their own voice", "hoping the next fire has a second cup"],
};

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

function locHash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function inSeason(id: CharacterId, state: GameState) {
  const c = CHARACTER_BY_ID[id];
  if (!c) return true;
  return c.seasons === "all" || c.seasons.includes(state.season);
}

function isWanderer(id: CharacterId) {
  return (WANDERERS as readonly string[]).includes(id);
}

function neighbors(id: LocationId): LocationId[] {
  return LOCATION_BY_ID[id]?.connections.map((c) => c.to) ?? [];
}

function edgeHours(from: LocationId, to: LocationId): number {
  const edge = LOCATION_BY_ID[from]?.connections.find((c) => c.to === to);
  return edge?.hours ?? 3;
}

/** Next step on a shortest trail, or null if already there / unreachable. */
export function nextHop(from: LocationId, to: LocationId): LocationId | null {
  if (from === to) return null;
  const direct = LOCATION_BY_ID[from]?.connections.some((c) => c.to === to);
  if (direct) return to;
  const seen = new Set<LocationId>([from]);
  const q: Array<{ at: LocationId; first: LocationId }> = [];
  for (const n of neighbors(from)) {
    q.push({ at: n, first: n });
    seen.add(n);
  }
  while (q.length) {
    const cur = q.shift()!;
    if (cur.at === to) return cur.first;
    for (const n of neighbors(cur.at)) {
      if (seen.has(n)) continue;
      seen.add(n);
      q.push({ at: n, first: cur.first });
    }
  }
  return neighbors(from)[0] ?? null;
}

function cloneWorld(world: WorldState): WorldState {
  const people: WorldState["people"] = {};
  for (const [id, p] of Object.entries(world.people)) {
    people[id] = { ...p };
  }
  return { people, rumors: [...world.rumors], lastSceneId: world.lastSceneId };
}

function seedNeed(rng: () => number, id: CharacterId): { need: PersonNeed; errand: string; mood: PersonMood } {
  const person = CHARACTER_BY_ID[id];
  let need: PersonNeed = pick(rng, NEEDS);
  if (person?.blurb.toLowerCase().includes("trade") && rng() < 0.4) need = "trade";
  if (isWanderer(id) && rng() < 0.35) need = pick(rng, ["news", "company", "food"] as const);
  return { need, errand: pick(rng, ERRAND[need]), mood: pick(rng, MOODS) };
}

function homeFor(id: CharacterId, rng: () => number): LocationId {
  const person = CHARACTER_BY_ID[id];
  const homes = person?.home ?? [];
  if (homes.length) return pick(rng, homes);
  return pick(
    rng,
    LOCATIONS.map((l) => l.id),
  );
}

export function seedWorld(state: GameState): GameState {
  const rng = mulberry32(state.rngSeed ^ 0x91a2);
  const people: WorldState["people"] = {};
  for (const person of CHARACTERS) {
    const { need, errand, mood } = seedNeed(rng, person.id);
    const atHome = rng() < (isWanderer(person.id) ? 0.35 : 0.72);
    const locationId = atHome ? homeFor(person.id, rng) : pick(rng, person.home.length ? person.home : [state.locationId]);
    const wander = !atHome || isWanderer(person.id);
    const headingTo =
      wander && rng() < 0.55
        ? pick(
            rng,
            neighbors(locationId).length ? neighbors(locationId) : [locationId],
          )
        : null;
    people[person.id] = {
      id: person.id,
      locationId,
      headingTo: headingTo === locationId ? null : headingTo,
      hoursLeft: 2 + Math.floor(rng() * 7),
      need,
      mood,
      errand,
    };
  }
  if (state.presentCharacterId && people[state.presentCharacterId]) {
    people[state.presentCharacterId] = {
      ...people[state.presentCharacterId]!,
      locationId: state.locationId,
      headingTo: null,
      hoursLeft: 3 + Math.floor(rng() * 4),
    };
  }
  if (state.companionId && people[state.companionId]) {
    people[state.companionId] = {
      ...people[state.companionId]!,
      locationId: state.locationId,
      headingTo: null,
    };
  }
  return {
    ...state,
    rngSeed: nextSeed(state.rngSeed),
    world: { people, rumors: [] },
  };
}

export function ensureWorld(state: GameState): GameState {
  if (state.world && Object.keys(state.world.people).length > 0) return state;
  return seedWorld(state);
}

export function peopleAt(state: GameState, locationId: LocationId = state.locationId): PersonLife[] {
  const world = state.world;
  if (!world) return [];
  const here: PersonLife[] = [];
  for (const life of Object.values(world.people)) {
    if (life.locationId !== locationId) continue;
    if (!inSeason(life.id, state)) continue;
    here.push(life);
  }
  here.sort((a, b) => a.id.localeCompare(b.id));
  return here;
}

function pickPresence(state: GameState, here: PersonLife[]): CharacterId | null {
  if (state.companionId && here.some((p) => p.id === state.companionId)) return state.companionId;
  if (state.presentCharacterId && here.some((p) => p.id === state.presentCharacterId)) {
    return state.presentCharacterId;
  }
  if (here.length === 0) return null;
  let best = here[0]!;
  let bestStand = state.standing[best.id] ?? 0;
  for (const p of here) {
    const stand = state.standing[p.id] ?? 0;
    if (stand > bestStand) {
      best = p;
      bestStand = stand;
    }
  }
  return best.id;
}

export function syncPresence(state: GameState): GameState {
  const next = ensureWorld(state);
  const here = peopleAt(next);
  return { ...next, presentCharacterId: pickPresence(next, here) };
}

export function placePerson(
  state: GameState,
  id: CharacterId | null,
  locationId: LocationId = state.locationId,
): GameState {
  const next = ensureWorld(state);
  if (!id) return { ...next, presentCharacterId: null };
  const world = cloneWorld(next.world!);
  const prev = world.people[id];
  world.people[id] = {
    id,
    locationId,
    headingTo: null,
    hoursLeft: Math.max(3, prev?.hoursLeft ?? 4),
    need: prev?.need ?? "company",
    mood: prev?.mood ?? "even",
    errand: prev?.errand ?? null,
    generated: prev?.generated,
  };
  return { ...next, world, presentCharacterId: id };
}

function newPlan(life: PersonLife, state: GameState, rng: () => number): PersonLife {
  if (!inSeason(life.id, state)) {
    return {
      ...life,
      locationId: homeFor(life.id, rng),
      headingTo: null,
      hoursLeft: 8 + Math.floor(rng() * 12),
    };
  }
  const person = CHARACTER_BY_ID[life.id];
  const homes = person?.home ?? [life.locationId];
  const { need, errand, mood } = rng() < 0.4 ? seedNeed(rng, life.id) : { need: life.need, errand: life.errand, mood: life.mood };
  const stayHome = !isWanderer(life.id) && homes.includes(life.locationId) && rng() < 0.55;
  if (stayHome) {
    return { ...life, headingTo: null, hoursLeft: 4 + Math.floor(rng() * 8), need, errand, mood };
  }
  const near = neighbors(life.locationId);
  const wantHome = !homes.includes(life.locationId) && rng() < 0.45;
  const dest = wantHome
    ? pick(rng, homes)
    : near.length
      ? pick(rng, near)
      : life.locationId;
  if (dest === life.locationId) {
    return { ...life, headingTo: null, hoursLeft: 3 + Math.floor(rng() * 6), need, errand, mood };
  }
  const hop = nextHop(life.locationId, dest) ?? dest;
  return {
    ...life,
    headingTo: dest,
    hoursLeft: edgeHours(life.locationId, hop),
    need,
    errand,
    mood,
  };
}

function stepPerson(life: PersonLife, state: GameState, rng: () => number): PersonLife {
  if (life.id === state.companionId) {
    return { ...life, locationId: state.locationId, headingTo: null, hoursLeft: Math.max(1, life.hoursLeft) };
  }
  if (!inSeason(life.id, state)) {
    if (life.hoursLeft > 1) return { ...life, hoursLeft: life.hoursLeft - 1 };
    return newPlan(life, state, rng);
  }
  const hoursLeft = life.hoursLeft - 1;
  if (hoursLeft > 0) return { ...life, hoursLeft };
  if (life.headingTo && life.headingTo !== life.locationId) {
    const hop = nextHop(life.locationId, life.headingTo);
    if (!hop) return newPlan({ ...life, headingTo: null }, state, rng);
    const arrived = hop === life.headingTo;
    return {
      ...life,
      locationId: hop,
      headingTo: arrived ? null : life.headingTo,
      hoursLeft: arrived ? 3 + Math.floor(rng() * 6) : edgeHours(hop, life.headingTo),
    };
  }
  return newPlan(life, state, rng);
}

function smokePull(state: GameState, world: WorldState, rng: () => number): WorldState {
  const smoke = state.camp?.smoke ?? 0;
  if (smoke < 2 || !state.camp) return world;
  const campAt = state.camp.locationId;
  if (rng() > 0.12 + smoke * 0.04) return world;
  const hungry = Object.values(world.people).filter((p) => {
    if (p.id === state.companionId) return false;
    if (!inSeason(p.id, state)) return false;
    if (p.locationId === campAt) return false;
    if (p.headingTo === campAt) return false;
    const need = p.need;
    return need === "warmth" || need === "company" || need === "food" || need === "news";
  });
  if (!hungry.length) return world;
  const pickOne = pick(rng, hungry);
  const hop = nextHop(pickOne.locationId, campAt);
  if (!hop) return world;
  world.people[pickOne.id] = {
    ...pickOne,
    headingTo: campAt,
    hoursLeft: edgeHours(pickOne.locationId, hop),
    errand: pickOne.need === "food" ? "following your smoke for a pot" : "following your smoke",
  };
  return world;
}

export function tickWorldHour(state: GameState): GameState {
  const base = ensureWorld(state);
  const rng = mulberry32(base.rngSeed ^ locHash(base.locationId) ^ (base.dayOfYear * 1009 + base.hour * 17));
  let world = cloneWorld(base.world!);
  for (const id of Object.keys(world.people)) {
    world.people[id] = stepPerson(world.people[id]!, base, rng);
  }
  world = smokePull(base, world, rng);
  const next: GameState = { ...base, world, rngSeed: nextSeed(base.rngSeed) };
  return syncPresence(next);
}

export function tickWorld(state: GameState, hours: number): GameState {
  let next = state;
  for (let i = 0; i < hours; i++) {
    if (next.dead) break;
    next = tickWorldHour(next);
  }
  return next;
}

export function addRumor(state: GameState, line: string): GameState {
  const text = line.trim();
  if (!text) return state;
  const next = ensureWorld(state);
  const world = cloneWorld(next.world!);
  const rumors = world.rumors.filter((r) => r !== text);
  rumors.push(text);
  world.rumors = rumors.slice(-8);
  return { ...next, world };
}
