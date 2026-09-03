import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { withBase } from "@/lib/paths";
import type { GameState, Season } from "@/lib/game/types";

export type CinemaKind = "season" | "death" | "camp" | "person";
export type CinemaKen = "push" | "pan" | "breathe";
export type CinemaMusic = "swell" | "dip";

export interface CinemaBeat {
  src: string;
  duration: number;
  ken?: CinemaKen;
}

export interface CinemaSequence {
  id: string;
  kind: CinemaKind;
  beats: CinemaBeat[];
  card: string;
  /** Total length in milliseconds. */
  duration: number;
  music?: CinemaMusic;
}

const SEASON_LINE: Record<Season, string> = {
  spring: "The creeks remember they are water. A later country begins.",
  summer: "The snowline climbs. Heat finds the parks and does not apologize.",
  fall: "The aspen turn. The hunt comes down through the timber.",
  winter: "The high country closes its fist. You are still inside it.",
};

function locArt(state: GameState): string {
  return LOCATION_BY_ID[state.locationId]?.art ?? "/art/locations/high-camp.jpg";
}

function timed(beats: Omit<CinemaSequence, "duration">): CinemaSequence {
  return { ...beats, duration: beats.beats.reduce((sum, b) => sum + b.duration, 0) };
}

function storageKey(kind: CinemaKind, extra = ""): string {
  return extra ? `hc-cinema-${kind}-${extra}` : `hc-cinema-${kind}`;
}

function alreadyPlayed(key: string): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markPlayed(key: string) {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // private mode, or tests
  }
}

function take(kind: CinemaKind, extra: string, build: () => CinemaSequence): CinemaSequence | null {
  const key = storageKey(kind, extra);
  if (alreadyPlayed(key)) return null;
  const seq = build();
  markPlayed(key);
  return seq;
}

export function seasonCinema(prev: GameState, next: GameState): CinemaSequence {
  const loc = locArt(next);
  return timed({
    id: `season-${next.year}-${next.season}`,
    kind: "season",
    music: "swell",
    card: SEASON_LINE[next.season],
    beats: [
      { src: withBase(loc), duration: 4500, ken: "push" },
      { src: withBase(`/art/atmosphere/${prev.season}.jpg`), duration: 4500, ken: "pan" },
      { src: withBase(`/art/atmosphere/${next.season}.jpg`), duration: 5000, ken: "push" },
      { src: withBase(loc), duration: 4000, ken: "breathe" },
    ],
  });
}

export function deathCinema(state: GameState): CinemaSequence {
  const loc = locArt(state);
  const cause = state.dead?.cause ?? "sickness";
  const detail = state.dead?.detail ?? "The mountain accepted the offering.";
  return timed({
    id: "death",
    kind: "death",
    music: "dip",
    card: `${detail} Filed as ${cause}.`,
    beats: [
      { src: withBase(loc), duration: 4000, ken: "push" },
      { src: withBase("/art/death.jpg"), duration: 8000, ken: "push" },
    ],
  });
}

export function firstCampCinema(state: GameState): CinemaSequence {
  const loc = locArt(state);
  const name = LOCATION_BY_ID[state.locationId]?.name ?? "this ground";
  return timed({
    id: "camp",
    kind: "camp",
    music: "swell",
    card: `You claim ${name}. Stones in a ring. The mountain files no objection.`,
    beats: [{ src: withBase(loc), duration: 6000, ken: "breathe" }],
  });
}

export function firstPersonCinema(state: GameState): CinemaSequence {
  const person = state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : undefined;
  const loc = locArt(state);
  const name = person?.name ?? "Someone";
  const portrait = person?.art;
  const beats: CinemaBeat[] = portrait
    ? [
        { src: withBase(portrait), duration: 2800, ken: "push" },
        { src: withBase(loc), duration: 3200, ken: "breathe" },
      ]
    : [{ src: withBase(loc), duration: 6000, ken: "breathe" }];
  return timed({
    id: `person-${state.presentCharacterId ?? "someone"}`,
    kind: "person",
    music: "swell",
    card: `${name} is on this ground now. The hour has a face.`,
    beats,
  });
}

/** Compare prev vs next after applyAction. Prefer death over season. Session-once. */
export function cinemaAfterAction(prev: GameState, next: GameState): CinemaSequence | null {
  if (next.dead && !prev.dead) {
    const death = take("death", "", () => deathCinema(next));
    if (death) return death;
  }
  if (next.season !== prev.season || next.year !== prev.year) {
    const season = take("season", `${next.year}-${next.season}`, () => seasonCinema(prev, next));
    if (season) return season;
  }
  if (!prev.camp && next.camp) {
    const camp = take("camp", "", () => firstCampCinema(next));
    if (camp) return camp;
  }
  if (
    !prev.presentCharacterId &&
    next.presentCharacterId &&
    !next.activeEncounterId &&
    !next.dead &&
    !next.skirmish
  ) {
    const person = take("person", "", () => firstPersonCinema(next));
    if (person) return person;
  }
  return null;
}
