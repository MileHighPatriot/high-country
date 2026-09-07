import { placeName } from "@/lib/game/readout";
import type { DeathRecord, GameState, Kit, LocationId, Season } from "@/lib/game/types";
import { ensureWorld } from "@/lib/game/world";

const SAVE_KEY = "colorado-survival-save-v1";
const BEST_KEY = "colorado-survival-best-v1";
const LAST_KEY = "colorado-survival-last-v1";

export interface CampaignMeta {
  name: string;
  daysSurvived: number;
  locationId: LocationId;
  season: Season;
  kit: Kit;
  savedAt: number;
}

export function campaignMetaFrom(state: GameState): CampaignMeta {
  return {
    name: state.name,
    daysSurvived: state.daysSurvived,
    locationId: state.locationId,
    season: state.season,
    kit: state.kit,
    savedAt: Date.now(),
  };
}

export function campaignLine(meta: Pick<CampaignMeta, "name" | "daysSurvived" | "locationId">): string {
  return `Day ${meta.daysSurvived} · ${placeName(meta.locationId)} · ${meta.name}`;
}

export function hydrateGame(parsed: GameState): GameState {
  const next: GameState = {
    ...parsed,
    camp: parsed.camp ?? null,
    memories: parsed.memories ?? {},
    openingId: parsed.openingId ?? "legacy",
    skills: parsed.skills ?? {},
    companionId: parsed.companionId ?? null,
    pendingRoll: parsed.pendingRoll ?? null,
    campfireHours: parsed.campfireHours ?? (parsed.campfire ? 4 : 0),
    world: parsed.world ?? null,
    waitScene: null,
  };
  return ensureWorld(next);
}

export function isLiveSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  if (typeof s.name !== "string" || !s.name.trim()) return false;
  if (typeof s.locationId !== "string" || !s.locationId) return false;
  if (!s.meters || typeof s.meters.hunger !== "number") return false;
  if (!s.inventory || typeof s.inventory.rations !== "number") return false;
  if (s.dead) return false;
  return true;
}

export function serializeGame(state: GameState): string {
  return JSON.stringify({ ...state, waitScene: null });
}

export function parseGame(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!isLiveSave(parsed)) return null;
    return hydrateGame(parsed);
  } catch {
    return null;
  }
}

export function exportFilename(state: Pick<GameState, "name" | "daysSurvived">): string {
  const who = state.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trapper";
  return `high-country-${who}-day-${state.daysSurvived}.json`;
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return parseGame(raw);
  } catch {
    return null;
  }
}

export function loadCampaignMeta(): CampaignMeta | null {
  const game = loadGame();
  if (!game) return null;
  return campaignMetaFrom(game);
}

export function saveGame(state: GameState) {
  if (typeof window === "undefined") return;
  if (state.dead) {
    localStorage.removeItem(SAVE_KEY);
    localStorage.setItem(LAST_KEY, JSON.stringify(state.dead));
    const best = loadBest();
    if (state.daysSurvived > best) {
      localStorage.setItem(BEST_KEY, String(state.daysSurvived));
    }
    return;
  }
  localStorage.setItem(SAVE_KEY, serializeGame(state));
}

export function clearSave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}

export function loadBest(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(BEST_KEY) || 0);
}

export function loadLastDeath(): DeathRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeathRecord;
  } catch {
    return null;
  }
}
