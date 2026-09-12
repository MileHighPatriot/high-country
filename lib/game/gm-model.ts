import { looksLikeTemplate, type GmAct } from "@/lib/game/gm";
import type { EncounterChoice, GameState } from "@/lib/game/types";

export const GM_KEY_STORAGE = "high-country-gm-key";

export function loadGmKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(GM_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function saveGmKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) window.localStorage.setItem(GM_KEY_STORAGE, key.trim());
    else window.localStorage.removeItem(GM_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

function nounsOf(act: GmAct): string[] {
  return act.facts.flatMap((f) => [f.name, ...f.nouns]).filter(Boolean);
}

function keepsNouns(text: string, nouns: string[]): boolean {
  const line = text.toLowerCase();
  return nouns.every((n) => line.includes(n.toLowerCase()) || n.split(" ").every((w) => w.length < 3 || line.includes(w.toLowerCase())));
}

/**
 * Optional SpaceXAI polish. Offline GM already mutated plot.
 * Rejects copy that drops the typed nouns or sounds like the old templates.
 */
export async function polishGmAct(act: GmAct, state: GameState, key: string): Promise<GmAct | null> {
  const nouns = nounsOf(act);
  const body = {
    model: "grok-4.5",
    input: [
      {
        role: "system",
        content:
          "You are the mountain, 1835 Colorado Front Range. Dry English. No magic, no anachronism, no wit. Return JSON only: {narration, hook, choices:[{id,label,text}]}. Keep every given noun. Do not invent modern things.",
      },
      {
        role: "user",
        content: JSON.stringify({
          said: act.narration,
          place: state.locationId,
          weather: state.weather,
          nouns,
          hook: act.encounter.text,
          choices: act.encounter.choices.map((c) => ({ id: c.id, label: c.label })),
        }),
      },
    ],
    temperature: 0.4,
  };
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const raw =
    data.output_text ??
    data.output?.map((o) => o.content?.map((c) => c.text ?? "").join("") ?? "").join("") ??
    "";
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) return null;
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
    narration?: string;
    hook?: string;
    choices?: Array<{ id: string; label: string; text?: string }>;
  };
  if (!parsed.narration || looksLikeTemplate(parsed.narration) || !keepsNouns(parsed.narration, nouns)) return null;
  const hook = parsed.hook ?? act.encounter.text;
  if (looksLikeTemplate(hook) || !keepsNouns(hook, nouns.slice(0, 1))) return null;
  const choices = act.encounter.choices.map((c) => {
    const hit = parsed.choices?.find((p) => p.id === c.id);
    if (!hit) return c;
    const next: EncounterChoice = { ...c, label: hit.label || c.label };
    if (hit.text && c.outcome) next.outcome = { ...c.outcome, text: hit.text };
    return next;
  });
  return {
    ...act,
    narration: parsed.narration,
    encounter: { ...act.encounter, text: hook, choices },
  };
}

/** Swap in polished copy after the offline GM already changed the plot. */
export function overlayPolish(state: GameState, polished: GmAct): GameState {
  const logs = state.log.slice();
  if (logs.length >= 2) {
    const prev = logs[logs.length - 2]!;
    logs[logs.length - 2] = { ...prev, text: polished.narration };
  }
  if (logs.length >= 1) {
    const last = logs[logs.length - 1]!;
    logs[logs.length - 1] = { ...last, text: polished.encounter.text };
  }
  const generated = (state.generatedEncounters ?? []).map((e) =>
    e.id === polished.encounter.id ? polished.encounter : e,
  );
  const has = generated.some((e) => e.id === polished.encounter.id);
  return {
    ...state,
    log: logs,
    generatedEncounters: has ? generated : [...generated, polished.encounter],
    activeEncounterId: state.activeEncounterId ? polished.encounter.id : state.activeEncounterId,
  };
}
