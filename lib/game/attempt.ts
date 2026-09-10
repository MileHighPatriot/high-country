import { planDie } from "@/lib/game/gm";
import type { Trait } from "@/lib/game/types";

export interface AttemptPlan {
  trait: Trait;
  dc: number;
  label: string;
  hours: number;
}

export function planAttempt(text: string): AttemptPlan {
  return planDie(text);
}

