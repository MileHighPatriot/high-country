import type { DeathRecord, GameState } from "@/lib/game/types";

const SAVE_KEY = "colorado-survival-save-v1";
const BEST_KEY = "colorado-survival-best-v1";
const LAST_KEY = "colorado-survival-last-v1";

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return {
      ...parsed,
      camp: parsed.camp ?? null,
      memories: parsed.memories ?? {},
      openingId: parsed.openingId ?? "legacy",
    };
  } catch {
    return null;
  }
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
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
