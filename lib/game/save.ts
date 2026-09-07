import { placeName } from "@/lib/game/readout";
import type { DeathRecord, GameState, Kit, LocationId, LogEntry, Season } from "@/lib/game/types";
import { ensureWorld } from "@/lib/game/world";

const SAVE_KEY = "colorado-survival-save-v1";
const BEST_KEY = "colorado-survival-best-v1";
const LAST_KEY = "colorado-survival-last-v1";
const SLIM_LOG = 12;

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

function keepLog(log: LogEntry[], keep: number): LogEntry[] {
  if (keep <= 0 || log.length <= keep) return log;
  const opening = log[0];
  const rest = log.slice(-(keep - 1));
  if (opening && rest[0]?.id !== opening.id) return [opening, ...rest];
  return rest;
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
    log: Array.isArray(parsed.log) ? parsed.log : [],
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

export function serializeGame(state: GameState, logKeep = 0): string {
  return JSON.stringify({
    ...state,
    waitScene: null,
    log: keepLog(state.log ?? [], logKeep),
  });
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

function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  const raw = storageGet(SAVE_KEY);
  if (!raw) return null;
  return parseGame(raw);
}

export function loadCampaignMeta(): CampaignMeta | null {
  const game = loadGame();
  if (!game) return null;
  return campaignMetaFrom(game);
}

export function saveGame(state: GameState): boolean {
  if (typeof window === "undefined") return false;
  if (state.dead) {
    storageRemove(SAVE_KEY);
    const lastOk = storageSet(LAST_KEY, JSON.stringify(state.dead));
    const best = loadBest();
    if (state.daysSurvived > best) {
      storageSet(BEST_KEY, String(state.daysSurvived));
    }
    return lastOk;
  }
  if (storageSet(SAVE_KEY, serializeGame(state))) return true;
  if (storageSet(SAVE_KEY, serializeGame(state, SLIM_LOG))) return true;
  return false;
}

export function downloadGame(state: GameState): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const blob = new Blob([serializeGame(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(state);
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function keepWalk(state: GameState): { saved: boolean; downloaded: boolean } {
  return {
    saved: saveGame(state),
    downloaded: downloadGame(state),
  };
}

export function clearSave() {
  storageRemove(SAVE_KEY);
}

export function loadBest(): number {
  return Number(storageGet(BEST_KEY) || 0);
}

export function loadLastDeath(): DeathRecord | null {
  const raw = storageGet(LAST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeathRecord;
  } catch {
    return null;
  }
}
