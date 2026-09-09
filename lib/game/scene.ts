import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { hourLabel, seasonLabel, weatherLabel } from "@/lib/game/engine";
import { storyLine } from "@/lib/game/improv";
import type { Choice, GameState, PersonLife } from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

export interface Scene {
  narration: string;
  peopleHere: PersonLife[];
  attemptHint: boolean;
  moves: Choice[];
}

function personLine(state: GameState, life: PersonLife): string {
  const person = CHARACTER_BY_ID[life.id];
  const name = person?.name ?? life.id;
  const stand = state.standing[life.id] ?? 0;
  const known = stand !== 0 || (state.memories?.[life.id]?.length ?? 0) > 0;
  const who = known ? name : `Someone — ${name}`;
  if (life.errand) return `${who} is here, ${life.errand}.`;
  if (life.need === "food") return `${who} looks hungry enough to say it.`;
  if (life.need === "warmth") return `${who} is holding themselves like a fire is owed.`;
  if (life.need === "trade") return `${who} has the look of a pack that wants to become someone else’s.`;
  if (life.headingTo) {
    const dest = LOCATION_BY_ID[life.headingTo]?.name;
    if (dest) return `${who} is only pausing. The trail toward ${dest} is still in their legs.`;
  }
  return `${who} is on this ground.`;
}

export function sceneNarration(state: GameState): string {
  const loc = LOCATION_BY_ID[state.locationId];
  const ground = loc?.name ?? state.locationId;
  const bits: string[] = [];
  bits.push(
    `${ground}. ${hourLabel(state.hour)}. ${seasonLabel(state.season)}. ${weatherLabel(state.weather)}.`,
  );
  if (state.campfire) bits.push("A fire is going.");
  else if (state.camp && state.camp.locationId === state.locationId) bits.push("Your camp is here. No fire.");
  const here = peopleAt(state);
  if (here.length === 0) {
    bits.push("Nobody else on this ground.");
  } else {
    for (const life of here.slice(0, 3)) bits.push(personLine(state, life));
    if (here.length > 3) bits.push(`And ${here.length - 3} more in the trees.`);
  }
  if (state.companionId && CHARACTER_BY_ID[state.companionId]) {
    bits.push(`${CHARACTER_BY_ID[state.companionId]!.name} is walking with you.`);
  }
  const tale = storyLine(state);
  if (tale) bits.push(tale);
  return bits.join(" ");
}

export function getScene(state: GameState, moves: Choice[]): Scene {
  const blocked = Boolean(state.dead || state.pendingRoll || state.waitScene);
  return {
    narration: sceneNarration(state),
    peopleHere: peopleAt(state),
    attemptHint: !blocked,
    moves,
  };
}
