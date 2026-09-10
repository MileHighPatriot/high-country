import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  CharacterDef,
  CharacterId,
  GameState,
  LocationDef,
  LocationId,
  StoryFact,
} from "@/lib/game/types";

export function locationOf(state: GameState | undefined, id: LocationId): LocationDef | undefined {
  const stock = LOCATION_BY_ID[id];
  const gen = state?.generatedPlaces?.find((p) => p.id === id);
  const extras = (state?.generatedPlaces ?? [])
    .filter((p) => p.parentId === id)
    .map((p) => ({ to: p.id, hours: p.hours, trailName: p.trailName }));
  if (stock) {
    if (!extras.length) return stock;
    return { ...stock, connections: [...stock.connections, ...extras] };
  }
  if (!gen) return undefined;
  const parent = LOCATION_BY_ID[gen.parentId];
  return {
    id: gen.id,
    name: gen.name,
    art: parent?.art ?? "/art/locations/high-camp.jpg",
    blurb: gen.blurb,
    tags: gen.tags,
    connections: [{ to: gen.parentId, hours: gen.hours, trailName: gen.trailName }, ...extras],
  };
}

export function characterOf(state: GameState | undefined, id: CharacterId | null | undefined): CharacterDef | undefined {
  if (!id) return undefined;
  const stock = CHARACTER_BY_ID[id];
  if (stock) return stock;
  const gen = state?.generatedPeople?.find((p) => p.id === id);
  if (!gen) return undefined;
  return {
    id: gen.id,
    name: gen.name,
    art: "",
    home: gen.home,
    seasons: "all",
    blurb: gen.blurb,
    fallback: gen.fallback,
    nodes: [],
  };
}

export function factsAt(state: GameState, locationId: LocationId = state.locationId): StoryFact[] {
  return (state.storyFacts ?? []).filter(
    (f) => f.status !== "gone" && (f.status === "carried" || f.locationId === locationId),
  );
}

export function focusFacts(state: GameState): StoryFact[] {
  const ids = state.focusFactIds ?? [];
  if (!ids.length) {
    return factsAt(state).filter((f) => f.kind === "shelter" || f.kind === "animal" || f.kind === "object" || f.kind === "person");
  }
  const set = new Set(ids);
  return (state.storyFacts ?? []).filter((f) => set.has(f.id) && f.status !== "gone");
}

export function placeTitle(state: GameState | undefined, id: LocationId | undefined): string {
  if (!id) return "the mountain";
  return locationOf(state, id)?.name ?? LOCATION_BY_ID[id]?.name ?? id;
}

export function personTitle(state: GameState | undefined, id: CharacterId | null | undefined): string {
  if (!id) return "someone";
  return characterOf(state, id)?.name ?? CHARACTER_BY_ID[id]?.name ?? id;
}
