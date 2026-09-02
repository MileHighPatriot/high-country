import type { EncounterDef } from "@/lib/game/types";
import { FALL_ENCOUNTERS } from "@/lib/game/content/encounters-fall";
import { SPRING_ENCOUNTERS } from "@/lib/game/content/encounters-spring";
import { SUMMER_ENCOUNTERS } from "@/lib/game/content/encounters-summer";
import { WINTER_ENCOUNTERS } from "@/lib/game/content/encounters-winter";

export { CHARACTERS, CHARACTER_BY_ID } from "@/lib/game/content/characters";
export { LOCATIONS, LOCATION_BY_ID } from "@/lib/game/content/locations";
export { choreEncounter } from "@/lib/game/content/chores";

let cache: EncounterDef[] | null = null;

export function allEncounters(): EncounterDef[] {
  if (!cache) {
    cache = [
      ...SPRING_ENCOUNTERS,
      ...SUMMER_ENCOUNTERS,
      ...FALL_ENCOUNTERS,
      ...WINTER_ENCOUNTERS,
    ];
  }
  return cache;
}
