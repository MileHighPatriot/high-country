import { addToPack, atOwnCamp, cloneCamp, spendFromPackOrCache } from "@/lib/game/camp";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  CampSite,
  CampStowItem,
  Choice,
  CraftTool,
  GameState,
  HomesteadWorkId,
  LocationId,
} from "@/lib/game/types";

export type WorkKind = "job" | "afternoon";
export type WorkSlot = "dwelling" | "interior" | "yard";

export interface HomesteadWork {
  id: HomesteadWorkId;
  label: string;
  done: string;
  slot: WorkSlot;
  kind: WorkKind;
  hours: number;
  logs?: number;
  stone?: number;
  pelts?: number;
  firewood?: number;
  tools?: CraftTool[];
  /** Dwelling stages that must already stand. */
  needs?: HomesteadWorkId[];
  walls?: number;
  roof?: boolean;
  unique?: LocationId[];
  tags?: Array<"water" | "wood" | "shelter" | "game">;
}

const WALLS: HomesteadWorkId[] = ["wall-wind", "wall-creek", "wall-timber", "wall-pass"];

export const WORKS: HomesteadWork[] = [
  { id: "platform", label: "Lay a platform", done: "The platform is in. This bench is home.", slot: "dwelling", kind: "job", hours: 20, logs: 6, tools: ["axe"] },
  { id: "wall-wind", label: "Raise the wind wall", done: "The wind wall stands. It still argues.", slot: "dwelling", kind: "job", hours: 16, logs: 4, tools: ["axe", "adze"], needs: ["platform"] },
  { id: "wall-creek", label: "Raise the creek wall", done: "The creek wall is seated.", slot: "dwelling", kind: "job", hours: 16, logs: 4, tools: ["axe", "adze"], needs: ["platform"] },
  { id: "wall-timber", label: "Raise the timber wall", done: "The timber wall is up.", slot: "dwelling", kind: "job", hours: 16, logs: 4, tools: ["axe", "adze"], needs: ["platform"] },
  { id: "wall-pass", label: "Raise the pass wall", done: "The pass wall closes the square.", slot: "dwelling", kind: "job", hours: 16, logs: 4, tools: ["axe", "adze"], needs: ["platform"] },
  { id: "roof", label: "Raise the roof", done: "A roof. Weather has to knock.", slot: "dwelling", kind: "job", hours: 24, logs: 6, pelts: 2, tools: ["axe"], needs: ["platform"], walls: 4 },
  { id: "door", label: "Hang a door", done: "The door hangs. The cabin has a mouth it can shut.", slot: "dwelling", kind: "afternoon", hours: 3, pelts: 1, tools: ["auger"], needs: ["roof"] },
  { id: "stove", label: "Build a stove", done: "Stone stove. Warmth stops being a rumor.", slot: "dwelling", kind: "job", hours: 16, stone: 6, tools: ["adze"], needs: ["roof"] },
  { id: "bunk", label: "Build a bunk", done: "A bunk. Sleep has an address.", slot: "interior", kind: "afternoon", hours: 3, logs: 2, tools: ["axe"], needs: ["roof"] },
  { id: "loft", label: "Frame a loft", done: "A loft. The roof earns its keep.", slot: "interior", kind: "afternoon", hours: 4, logs: 2, tools: ["axe", "auger"], needs: ["roof"] },
  { id: "shelves", label: "Put up shelves", done: "Shelves. The pack can breathe.", slot: "interior", kind: "afternoon", hours: 2, logs: 1, tools: ["auger"], needs: ["roof"] },
  { id: "table", label: "Build a table", done: "A table. Work has a surface.", slot: "interior", kind: "afternoon", hours: 3, logs: 2, tools: ["adze"], needs: ["roof"] },
  { id: "latch", label: "Fit a latch", done: "A latch. Night is less of a visitor.", slot: "interior", kind: "afternoon", hours: 2, tools: ["auger"], needs: ["door"] },
  { id: "floor", label: "Lay floor boards", done: "Boards. Dirt stays under them.", slot: "interior", kind: "afternoon", hours: 5, logs: 3, tools: ["adze"], needs: ["roof"] },
  { id: "shutters", label: "Hang shutters", done: "Shutters. Wind has to ask.", slot: "interior", kind: "afternoon", hours: 3, logs: 1, pelts: 1, tools: ["auger"], needs: ["roof"] },
  { id: "window-skin", label: "Stretch a window skin", done: "A hide window. Light without a door.", slot: "interior", kind: "afternoon", hours: 2, pelts: 1, needs: ["roof"] },
  { id: "peg-rail", label: "Set a peg rail", done: "Pegs. Coats stop living on the floor.", slot: "interior", kind: "afternoon", hours: 2, logs: 1, tools: ["auger"], needs: ["roof"] },
  { id: "wash-basin", label: "Set a wash basin", done: "A basin. Hands can be something other than camp.", slot: "interior", kind: "afternoon", hours: 2, stone: 1, needs: ["roof"] },
  { id: "lamp-niche", label: "Cut a lamp niche", done: "A niche. Night work is less of a sin.", slot: "interior", kind: "afternoon", hours: 2, stone: 1, needs: ["roof"] },
  { id: "wood-shed", label: "Raise a wood shed", done: "A wood shed. The pile has a roof of its own.", slot: "yard", kind: "job", hours: 12, logs: 4, tools: ["axe"], needs: ["platform"] },
  { id: "storage-shed", label: "Raise a storage shed", done: "A shed. Mice still file claims.", slot: "yard", kind: "job", hours: 16, logs: 5, tools: ["axe"], needs: ["platform"] },
  { id: "smokehouse", label: "Build a smokehouse", done: "A smokehouse. Meat learns patience.", slot: "yard", kind: "job", hours: 18, logs: 4, stone: 2, tools: ["axe"], needs: ["platform"] },
  { id: "outhouse", label: "Dig an outhouse", done: "An outhouse. Health notices.", slot: "yard", kind: "afternoon", hours: 5, logs: 2, tools: ["axe"], needs: ["platform"] },
  { id: "garden", label: "Break a garden", done: "A garden. Summer still has to agree.", slot: "yard", kind: "job", hours: 10, needs: ["platform"] },
  { id: "rain-barrel", label: "Set a rain barrel", done: "A barrel under the eave. Roof water.", slot: "yard", kind: "afternoon", hours: 3, logs: 1, needs: ["roof"] },
  { id: "filter", label: "Pack a sand filter", done: "Sand, charcoal, patience. Water comes cleaner.", slot: "yard", kind: "afternoon", hours: 4, stone: 1, firewood: 1, needs: ["rain-barrel"] },
  { id: "spring-box", label: "Build a spring box", done: "A stone box on the seep. Water that waits.", slot: "yard", kind: "job", hours: 12, stone: 4, tags: ["water"], needs: ["platform"] },
  { id: "root-cellar", label: "Dig a root cellar", done: "A cellar. Winter has a pantry.", slot: "yard", kind: "job", hours: 20, stone: 4, needs: ["platform"] },
  { id: "hide-stretchers", label: "Set hide stretchers", done: "Stretchers. Pelts become more.", slot: "yard", kind: "afternoon", hours: 3, logs: 2, needs: ["platform"] },
  { id: "meat-pole", label: "Raise a meat pole", done: "A pole. Meat off the dirt.", slot: "yard", kind: "afternoon", hours: 2, logs: 1, tools: ["axe"], needs: ["platform"] },
  { id: "palisade", label: "Raise a brush palisade", done: "A palisade. Theft has to climb.", slot: "yard", kind: "job", hours: 28, logs: 10, tools: ["axe"], needs: ["platform"] },
  { id: "wash-trough", label: "Hollow a wash trough", done: "A trough. Water does a second job.", slot: "yard", kind: "afternoon", hours: 3, logs: 1, tools: ["adze"], needs: ["platform"] },
  { id: "lookout", label: "Blaze a lookout", done: "A lookout blaze. Weather and visitors show sooner.", slot: "yard", kind: "afternoon", hours: 2, needs: ["platform"] },
  { id: "fish-rack", label: "Raise a fish rack", done: "A fish rack over water-smell.", slot: "yard", kind: "afternoon", hours: 3, logs: 2, tags: ["water"], needs: ["platform"] },
  { id: "ice-cellar", label: "Cut an ice cellar", done: "Ice in the rock. Summer meat keeps.", slot: "yard", kind: "job", hours: 14, stone: 2, unique: ["talus-ice-cave", "frozen-fall"], needs: ["platform"] },
];

const BY_ID: Record<string, HomesteadWork> = Object.fromEntries(WORKS.map((w) => [w.id, w]));

export function workById(id: string): HomesteadWork | undefined {
  return BY_ID[id];
}

export function hasTool(state: GameState, tool: CraftTool): boolean {
  const extras = state.inventory.extras;
  if (extras.includes(tool)) return true;
  if (tool === "axe" && extras.includes("stone-axe")) return true;
  return false;
}

function wallCount(camp: CampSite): number {
  const w = camp.walls ?? { wind: false, creek: false, timber: false, pass: false };
  return Number(w.wind) + Number(w.creek) + Number(w.timber) + Number(w.pass);
}

export function hasWork(camp: CampSite, id: HomesteadWorkId): boolean {
  if (id === "platform") return Boolean(camp.platform);
  if (id === "roof") return Boolean(camp.roof);
  if (id === "door") return Boolean(camp.door);
  if (id === "stove") return Boolean(camp.stove);
  if (id === "wall-wind") return Boolean(camp.walls?.wind);
  if (id === "wall-creek") return Boolean(camp.walls?.creek);
  if (id === "wall-timber") return Boolean(camp.walls?.timber);
  if (id === "wall-pass") return Boolean(camp.walls?.pass);
  return (camp.addons ?? []).includes(id) || (camp.interiors ?? []).includes(id);
}

function locOk(state: GameState, work: HomesteadWork): boolean {
  const loc = LOCATION_BY_ID[state.locationId];
  if (work.unique && !work.unique.includes(state.locationId)) return false;
  if (work.tags && !work.tags.some((t) => loc?.tags.includes(t))) return false;
  return true;
}

export function canRaise(state: GameState, id: HomesteadWorkId): { ok: boolean; reason?: string } {
  if (!atOwnCamp(state) || !state.camp) return { ok: false, reason: "Raise it on your own bench." };
  const camp = state.camp;
  const work = BY_ID[id];
  if (!work) return { ok: false, reason: "Unknown work." };
  if (hasWork(camp, id)) return { ok: false, reason: "That already stands." };
  if ((camp.wrecked ?? []).includes(id)) {
    /* rebuild allowed */
  }
  if (!locOk(state, work)) return { ok: false, reason: "This ground will not take that." };
  if (camp.jobs.some((j) => j.kind === id)) return { ok: false, reason: "That job is already running." };
  if (work.needs) {
    for (const n of work.needs) {
      if (!hasWork(camp, n) && !(n === "platform" && camp.platform)) {
        return { ok: false, reason: `Needs ${BY_ID[n]?.label ?? n} first.` };
      }
    }
  }
  if (work.walls && wallCount(camp) < work.walls) {
    return { ok: false, reason: "Four walls before a roof." };
  }
  if (work.roof && !camp.roof) return { ok: false, reason: "Needs a roof." };
  for (const tool of work.tools ?? []) {
    if (!hasTool(state, tool)) return { ok: false, reason: `Needs a ${tool}.` };
  }
  const stock = (item: CampStowItem, n: number) => {
    const have = state.inventory[item] + (camp.cache[item] ?? 0);
    return have >= n;
  };
  if (work.logs && !stock("logs", work.logs)) return { ok: false, reason: `Needs ${work.logs} logs.` };
  if (work.stone && !stock("stone", work.stone)) return { ok: false, reason: `Needs ${work.stone} stone.` };
  if (work.pelts && !stock("pelts", work.pelts)) return { ok: false, reason: `Needs ${work.pelts} pelts.` };
  if (work.firewood && !stock("firewood", work.firewood)) return { ok: false, reason: `Needs ${work.firewood} wood.` };
  return { ok: true };
}

function spendAll(state: GameState, work: HomesteadWork): GameState | null {
  let next = state;
  const pay = (item: CampStowItem, n?: number) => {
    if (!n) return true;
    const spent = spendFromPackOrCache(next, item, n);
    if (!spent) return false;
    next = spent;
    return true;
  };
  if (!pay("logs", work.logs)) return null;
  if (!pay("stone", work.stone)) return null;
  if (!pay("pelts", work.pelts)) return null;
  if (!pay("firewood", work.firewood)) return null;
  return next;
}

export function markWork(camp: CampSite, id: HomesteadWorkId): CampSite {
  const next = cloneCamp(camp);
  next.wrecked = (next.wrecked ?? []).filter((w) => w !== id);
  if (id === "platform") {
    next.platform = true;
    next.locked = true;
  } else if (id === "roof") next.roof = true;
  else if (id === "door") next.door = true;
  else if (id === "stove") next.stove = true;
  else if (id === "wall-wind") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), wind: true };
  else if (id === "wall-creek") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), creek: true };
  else if (id === "wall-timber") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), timber: true };
  else if (id === "wall-pass") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), pass: true };
  else if (BY_ID[id]?.slot === "interior") {
    next.interiors = [...(next.interiors ?? [])];
    if (!next.interiors.includes(id)) next.interiors.push(id);
  } else {
    next.addons = [...(next.addons ?? [])];
    if (!next.addons.includes(id)) next.addons.push(id);
  }
  return next;
}

export function wreckWork(camp: CampSite, id: HomesteadWorkId): CampSite {
  const next = cloneCamp(camp);
  if (id === "platform") {
    next.platform = false;
  } else if (id === "roof") next.roof = false;
  else if (id === "door") next.door = false;
  else if (id === "stove") next.stove = false;
  else if (id === "wall-wind") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), wind: false };
  else if (id === "wall-creek") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), creek: false };
  else if (id === "wall-timber") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), timber: false };
  else if (id === "wall-pass") next.walls = { ...(next.walls ?? { wind: false, creek: false, timber: false, pass: false }), pass: false };
  else {
    next.addons = (next.addons ?? []).filter((a) => a !== id);
    next.interiors = (next.interiors ?? []).filter((a) => a !== id);
  }
  next.wrecked = [...(next.wrecked ?? [])];
  if (!next.wrecked.includes(id)) next.wrecked.push(id);
  return next;
}

export function startRaise(state: GameState, id: HomesteadWorkId): { state: GameState; text: string; hours: number } | { error: string } {
  const can = canRaise(state, id);
  if (!can.ok) return { error: can.reason ?? "Cannot raise that." };
  const work = BY_ID[id]!;
  const spent = spendAll(state, work);
  if (!spent || !spent.camp) return { error: "You do not have the timber, stone, or hide." };
  let next = spent;
  next.camp = cloneCamp(next.camp!);
  if (work.kind === "afternoon") {
    next.camp = markWork(next.camp, id);
    return { state: next, text: work.done, hours: work.hours };
  }
  next.camp.jobs = [
    ...next.camp.jobs,
    {
      id: `${id}-${state.dayOfYear}-${state.hour}-${state.rngSeed.toString(36)}`,
      kind: id,
      hoursLeft: work.hours,
      startedOnDay: state.dayOfYear,
    },
  ];
  return { state: next, text: `You start: ${work.label}. ${work.hours} hours if the mountain allows.`, hours: 1 };
}

export function finishRaise(state: GameState, id: HomesteadWorkId): GameState {
  if (!state.camp) return state;
  return { ...state, camp: markWork(state.camp, id) };
}

export function homesteadChoices(state: GameState): Choice[] {
  if (!atOwnCamp(state) || !state.camp) return [];
  const out: Choice[] = [];
  for (const work of WORKS) {
    const can = canRaise(state, work.id);
    if (!can.ok) continue;
    if (state.camp.jobs.some((j) => j.kind === work.id)) continue;
    out.push({
      id: `raise-${work.id}`,
      label: work.label,
      hint: canHint(work),
      action: { type: "raise", work: work.id },
      tier: "routine",
    });
  }
  return out.slice(0, 8);
}

function canHint(work: HomesteadWork): string {
  const bits: string[] = [];
  if (work.kind === "job") bits.push(`${work.hours} hr job`);
  else bits.push(`${work.hours} hr`);
  if (work.logs) bits.push(`${work.logs} logs`);
  if (work.stone) bits.push(`${work.stone} stone`);
  if (work.pelts) bits.push(`${work.pelts} pelts`);
  if (work.tools?.length) bits.push(work.tools.join(" · "));
  return bits.join(" · ");
}

export function dwellingLine(camp: CampSite): string {
  if (camp.stove && camp.roof && camp.door) return "Cabin with a stove";
  if (camp.roof && camp.door) return "Cabin, no stove";
  if (camp.roof) return "Roofed cabin, open mouth";
  const walls = wallCount(camp);
  if (walls > 0) return `Platform and ${walls} wall${walls === 1 ? "" : "s"}`;
  if (camp.platform) return "Locked platform";
  if (camp.leanTo) return "Lean-to";
  return "Claimed bench";
}

export function chopBonus(state: GameState): number {
  const loc = LOCATION_BY_ID[state.locationId];
  if (loc?.tags.includes("wood")) return 1;
  if (state.locationId === "timberline" || state.locationId === "burned-timber" || state.locationId === "high-camp") return 1;
  return 0;
}

export function stoneGround(state: GameState): boolean {
  const id = state.locationId;
  return (
    LOCATION_BY_ID[id]?.tags.includes("water") ||
    id === "talus-ice-cave" ||
    id === "avalanche-chute" ||
    id === "homesteader-ruin" ||
    id === "wind-saddle"
  );
}

const TOOL_COST: Record<CraftTool, { logs?: number; stone?: number; pelts?: number; label: string; done: string }> = {
  axe: { logs: 1, stone: 1, label: "Haft a stone axe", done: "A stone axe. Ugly. It will drop trees if you make it." },
  adze: { logs: 1, stone: 1, label: "Make an adze", done: "An adze. Logs can be seated instead of stacked." },
  auger: { logs: 1, pelts: 1, label: "Make an auger", done: "An auger. Pegs and doors become possible." },
};

export function craftTool(state: GameState, tool: CraftTool): { state: GameState; text: string } | { error: string } {
  if (hasTool(state, tool)) return { error: `You already carry a ${tool}.` };
  const cost = TOOL_COST[tool];
  let next = state;
  if (cost.logs) {
    const spent = spendFromPackOrCache(next, "logs", cost.logs);
    if (!spent) return { error: "Need a log." };
    next = spent;
  }
  if (cost.stone) {
    const spent = spendFromPackOrCache(next, "stone", cost.stone);
    if (!spent) return { error: "Need stone." };
    next = spent;
  }
  if (cost.pelts) {
    const spent = spendFromPackOrCache(next, "pelts", cost.pelts);
    if (!spent) return { error: "Need a pelt." };
    next = spent;
  }
  next = {
    ...next,
    inventory: { ...next.inventory, extras: [...next.inventory.extras, tool === "axe" ? "stone-axe" : tool] },
  };
  return { state: next, text: cost.done };
}

export function toolChoices(state: GameState): Choice[] {
  const out: Choice[] = [];
  (["axe", "adze", "auger"] as const).forEach((tool) => {
    if (hasTool(state, tool)) return;
    out.push({
      id: `craft-${tool}`,
      label: TOOL_COST[tool].label,
      hint: tool === "auger" ? "1 log · 1 pelt" : "1 log · 1 stone",
      action: { type: "craftTool", tool },
      tier: "routine",
    });
  });
  return out;
}

export function maybeWreckHomestead(state: GameState, rng: () => number): { state: GameState; line: string | null } {
  if (!state.camp || state.camp.locationId !== state.locationId) return { state, line: null };
  const camp = state.camp;
  const loc = state.locationId;
  const unfinishedWall = Boolean(camp.platform && !camp.roof && WALLS.some((w) => hasWork(camp, w)));
  let target: HomesteadWorkId | null = null;
  let how = "";
  if ((state.weather === "blizzard" || state.weather === "wind") && unfinishedWall && rng() < 0.22) {
    const up = WALLS.filter((w) => hasWork(camp, w));
    target = up[Math.floor(rng() * up.length)] ?? "platform";
    how = "The wind takes unfinished work like a debt.";
  } else if (
    (loc === "creek" || loc === "beaver-meadow" || loc === "frozen-fall") &&
    (state.weather === "storm" || state.weather === "blizzard") &&
    rng() < 0.16
  ) {
    const wetList: HomesteadWorkId[] = ["garden", "rain-barrel", "filter", "spring-box", "outhouse"];
    const wet = wetList.filter((id) => hasWork(camp, id));
    target = wet[Math.floor(rng() * wet.length)] ?? null;
    how = "Flood water walks through the yard.";
  } else if (
    (loc === "avalanche-chute" || loc === "grizzly-basin" || loc === "wind-saddle") &&
    (state.weather === "blizzard" || state.weather === "snow") &&
    rng() < 0.1
  ) {
    const heavyList: HomesteadWorkId[] = [...WALLS, "roof", "wood-shed", "palisade", "storage-shed"];
    const heavy = heavyList.filter((id) => hasWork(camp, id));
    target = heavy[Math.floor(rng() * heavy.length)] ?? null;
    how = "The slope lets go. Snow and timber rewrite the compound.";
  } else if (state.campfire && camp.smoke >= 3 && (loc === "burned-timber" || state.weather === "wind") && rng() < 0.12) {
    const burnList: HomesteadWorkId[] = ["wood-shed", "roof", "storage-shed"];
    const burn = burnList.filter((id) => hasWork(camp, id));
    target = burn[Math.floor(rng() * burn.length)] ?? null;
    how = "Fire finds the dry work.";
  }
  if (!target) return { state, line: null };
  const next = { ...state, camp: wreckWork(camp, target) };
  const name = BY_ID[target]?.label ?? target;
  return { state: next, line: `${how} ${name} is down. The bench is still yours. Rebuild.` };
}

export function hydrateCampSite(camp: CampSite): CampSite {
  const cache = {
    ...camp.cache,
    logs: camp.cache.logs ?? 0,
    stone: camp.cache.stone ?? 0,
    extras: [...(camp.cache.extras ?? [])],
  };
  return {
    ...camp,
    cache,
    locked: camp.locked ?? Boolean(camp.platform),
    platform: camp.platform ?? false,
    walls: camp.walls ?? { wind: false, creek: false, timber: false, pass: false },
    roof: camp.roof ?? false,
    door: camp.door ?? false,
    stove: camp.stove ?? false,
    addons: camp.addons ?? [],
    interiors: camp.interiors ?? [],
    wrecked: camp.wrecked ?? [],
  };
}
