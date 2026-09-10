import { characterOf, factsAt, focusFacts, locationOf, placeTitle } from "@/lib/game/atlas";
import { hourLabel, seasonLabel, weatherLabel } from "@/lib/game/engine";
import type { Choice, GameState, PersonLife } from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

export interface Scene {
  narration: string;
  peopleHere: PersonLife[];
  attemptHint: boolean;
  moves: Choice[];
}

function personLine(state: GameState, life: PersonLife): string {
  const person = characterOf(state, life.id);
  const name = person?.name ?? life.id;
  const stand = state.standing[life.id] ?? 0;
  const known = stand !== 0 || (state.memories?.[life.id]?.length ?? 0) > 0 || life.generated;
  const who = known ? name : `Someone — ${name}`;
  if (life.errand) return `${who} is here, ${life.errand}.`;
  if (life.need === "food") return `${who} looks hungry enough to say it.`;
  if (life.need === "warmth") return `${who} is holding themselves like a fire is owed.`;
  if (life.need === "trade") return `${who} has the look of a pack that wants to become someone else’s.`;
  if (life.headingTo) {
    const dest = placeTitle(state, life.headingTo);
    if (dest) return `${who} is only pausing. The trail toward ${dest} is still in their legs.`;
  }
  return `${who} is on this ground.`;
}

function factLine(fact: { kind: string; name: string; note: string }): string {
  if (fact.kind === "shelter") return `The ${fact.name} is still here. ${fact.note}`;
  if (fact.kind === "animal") return `The ${fact.name} is still a fact of this ground.`;
  if (fact.kind === "person") return fact.note;
  if (fact.kind === "object") return `The ${fact.name} has not unhappened.`;
  if (fact.kind === "place" || fact.kind === "trail") return fact.note;
  return fact.note;
}

export function sceneNarration(state: GameState): string {
  const loc = locationOf(state, state.locationId);
  const ground = loc?.name ?? state.locationId;
  const bits: string[] = [];
  bits.push(
    `${ground}. ${hourLabel(state.hour)}. ${seasonLabel(state.season)}. ${weatherLabel(state.weather)}.`,
  );
  const focused = focusFacts(state);
  const hereFacts = focused.length ? focused : factsAt(state).slice(0, 3);
  for (const fact of hereFacts.slice(0, 3)) bits.push(factLine(fact));
  if (state.inventory.extras.includes("snow-hole")) {
    if (!hereFacts.some((f) => f.kind === "shelter")) bits.push("You are in a hole you made.");
  }
  if (state.campfire) bits.push("A fire is going.");
  else if (state.camp && state.camp.locationId === state.locationId) bits.push("Your camp is here. No fire.");
  const here = peopleAt(state);
  if (here.length === 0) {
    bits.push("Nobody else on this ground.");
  } else {
    for (const life of here.slice(0, 3)) bits.push(personLine(state, life));
    if (here.length > 3) bits.push(`And ${here.length - 3} more in the trees.`);
  }
  if (state.companionId && characterOf(state, state.companionId)) {
    bits.push(`${characterOf(state, state.companionId)!.name} is walking with you.`);
  }
  return bits.join(" ");
}

export function getScene(state: GameState, moves: Choice[]): Scene {
  return {
    narration: sceneNarration(state),
    peopleHere: peopleAt(state),
    attemptHint: !state.dead && !state.skirmish,
    moves,
  };
}
