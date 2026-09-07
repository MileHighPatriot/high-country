import type { GameState, Trait } from "@/lib/game/types";

export interface AttemptPlan {
  trait: Trait;
  dc: number;
  label: string;
  hours: number;
}

const RULES: Array<{ re: RegExp; trait: Trait; dc: number; label: string; hours: number }> = [
  { re: /\b(hunt|shoot|rifle|elk|deer|game|track meat)\b/, trait: "eye", dc: 12, label: "Hunt", hours: 2 },
  { re: /\b(aim|watch|spot|lookout|glass)\b/, trait: "eye", dc: 12, label: "Watch the ground", hours: 1 },
  { re: /\b(scout|track|sign|follow|read the|trail)\b/, trait: "savvy", dc: 12, label: "Read sign", hours: 2 },
  { re: /\b(ask|talk|speak|trade|bargain|tell)\b/, trait: "savvy", dc: 11, label: "Speak", hours: 1 },
  { re: /\b(climb|mend|make|build|spark|fire|skin|sew|cut ice|fish)\b/, trait: "hands", dc: 12, label: "Work with the hands", hours: 2 },
  { re: /\b(push|endure|cold|storm|wait out|grit|hold)\b/, trait: "grit", dc: 13, label: "Endure", hours: 2 },
  { re: /\b(sneak|hide|creep|quiet)\b/, trait: "savvy", dc: 13, label: "Go quiet", hours: 1 },
  { re: /\b(pray|god|lord)\b/, trait: "grit", dc: 10, label: "Pray", hours: 1 },
];

export function planAttempt(text: string): AttemptPlan {
  const line = text.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.re.test(line)) return { trait: rule.trait, dc: rule.dc, label: rule.label, hours: rule.hours };
  }
  return { trait: "savvy", dc: 13, label: "Try it", hours: 1 };
}

export function attemptCopy(state: GameState, text: string, plan: AttemptPlan, success: boolean): string {
  const intent = text.trim().replace(/\s+/g, " ");
  const who = state.presentCharacterId ? "They watch you do it." : "The mountain does not comment.";
  if (success) {
    return `You try: ${intent}. It holds. ${plan.label} goes your way. ${who}`;
  }
  return `You try: ${intent}. The country disagrees. ${plan.label} comes apart in the hands. ${who}`;
}
