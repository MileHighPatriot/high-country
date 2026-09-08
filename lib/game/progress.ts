import type { CampStowItem, GameState, Inventory, Trait } from "@/lib/game/types";
import { PACK_LIMITS } from "@/lib/game/types";

export const SKILL_IDS = ["ice", "sign", "hide", "rifle", "camp"] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export type Skills = Record<SkillId, number>;

export const SKILL_LABELS: Record<SkillId, string> = {
  ice: "Ice",
  sign: "Sign",
  hide: "Hide",
  rifle: "Rifle",
  camp: "Camp",
};

const SKILL_TRAIT: Record<SkillId, Trait> = {
  ice: "hands",
  sign: "savvy",
  hide: "hands",
  rifle: "eye",
  camp: "grit",
};

const LEARNED: Record<SkillId, [string, string, string]> = {
  ice: [
    "The ice tells you where it is thin. You start to listen.",
    "You cut a drinking hole the way other men cut bread.",
    "Winter water is a job you have already finished in your hands.",
  ],
  sign: [
    "Tracks stop being weather. They become sentences.",
    "You read a saddle the way a clerk reads a ledger.",
    "The country has a handwriting. You can pick it out of a crowd.",
  ],
  hide: [
    "The pelt teaches you. Fat, hair, the grain that will not tear.",
    "You can make a bag that does not lie about how much it will hold.",
    "Hide work sits in the fingers. You do not have to watch them.",
  ],
  rifle: [
    "The pan starts to feel like an argument you have had before.",
    "You waste less powder. The rifle becomes a sentence, not a shout.",
    "You do not miss because you are surprised. Only because the animal is luckier.",
  ],
  camp: [
    "Stones in a ring stop being a guess.",
    "You can raise a bench that will still be a bench in the morning.",
    "Camp is a craft. The mountain files no objection, and neither do your hands.",
  ],
};

export function emptySkills(): Skills {
  return { ice: 0, sign: 0, hide: 0, rifle: 0, camp: 0 };
}

export function skillsOf(state: GameState): Skills {
  return { ...emptySkills(), ...state.skills };
}

export function skillRank(state: GameState, id: SkillId): number {
  return skillsOf(state)[id] ?? 0;
}

export function skilledDc(state: GameState, id: SkillId, dc: number): number {
  return Math.max(8, dc - skillRank(state, id));
}

export function packLimitsFor(extras: string[]): Record<CampStowItem, number> {
  const bag = extras.includes("hide-bag") ? 2 : 0;
  const parfleche = extras.includes("parfleche") ? 2 : 0;
  const n = bag + parfleche;
  return {
    rations: PACK_LIMITS.rations + n,
    water: PACK_LIMITS.water + n,
    firewood: PACK_LIMITS.firewood + Math.min(2, n),
    pelts: PACK_LIMITS.pelts + n,
    powder: PACK_LIMITS.powder + n,
    logs: PACK_LIMITS.logs + n,
    stone: PACK_LIMITS.stone + Math.min(2, n),
  };
}

export function packCap(inv: Inventory, item: CampStowItem): number {
  return packLimitsFor(inv.extras)[item];
}

export function practiceSkill(
  state: GameState,
  id: SkillId,
): { state: GameState; line: string | null } {
  const skills = skillsOf(state);
  const before = skills[id] ?? 0;
  if (before >= 3) return { state, line: null };
  skills[id] = before + 1;
  let next: GameState = { ...state, skills };
  const line = LEARNED[id][before] ?? null;
  if (skills[id] === 3) {
    const trait = SKILL_TRAIT[id];
    const value = next.traits[trait];
    if (value < 5) {
      next = {
        ...next,
        traits: { ...next.traits, [trait]: value + 1 },
      };
      return {
        state: next,
        line: line ? `${line} ${traitLabel(trait)} takes a permanent step.` : line,
      };
    }
  }
  return { state: next, line };
}

function traitLabel(trait: Trait): string {
  return { eye: "Eye", grit: "Grit", savvy: "Savvy", hands: "Hands" }[trait];
}

export function skillStatusLine(state: GameState): string | null {
  const skills = skillsOf(state);
  const parts = SKILL_IDS.filter((id) => skills[id] > 0).map(
    (id) => `${SKILL_LABELS[id]} ${"I".repeat(skills[id])}`,
  );
  return parts.length ? parts.join(" · ") : null;
}
