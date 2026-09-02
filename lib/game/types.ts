export type Season = "spring" | "summer" | "fall" | "winter";
export type Weather = "clear" | "wind" | "snow" | "blizzard" | "storm";
export type Trait = "eye" | "grit" | "savvy" | "hands";
export type Kit = "rations" | "powder" | "coat";
export type RangeBand = "far" | "near" | "close";
export type TimeBand = "night" | "dawn" | "morning" | "afternoon" | "dusk";
export type EncounterTrigger =
  | "search"
  | "arrive"
  | "wait"
  | "eat"
  | "drink"
  | "fire"
  | "hunt"
  | "scout"
  | "sleep"
  | "fish"
  | "mend"
  | "pray"
  | "snares"
  | "shelter"
  | "camp";
export type LocationTag = "water" | "wood" | "shelter" | "game" | "trade";
export type DeathCause =
  | "starvation"
  | "thirst"
  | "exposure"
  | "exhaustion"
  | "violence"
  | "accident"
  | "sickness";

export type LocationId = string;
export type CharacterId = string;
export type EncounterId = string;

export interface Meters {
  hunger: number;
  thirst: number;
  warmth: number;
  energy: number;
  health: number;
}

export interface Inventory {
  rations: number;
  water: number;
  firewood: number;
  pelts: number;
  powder: number;
  knife: boolean;
  rifle: boolean;
  coat: boolean;
  extras: string[];
}

export interface Traits {
  eye: number;
  grit: number;
  savvy: number;
  hands: number;
}

export interface RollResult {
  d20: number;
  trait: Trait;
  modifier: number;
  penalty: number;
  dc: number;
  total: number;
  success: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  roll?: RollResult;
}

export interface SkirmishFoe {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  range: RangeBand;
  damage: [number, number];
  art?: string;
}

export interface SkirmishState {
  foes: SkirmishFoe[];
  allyName?: string;
  allyArt?: string;
  playerCover: boolean;
  awaiting: "player" | "resolving";
  intro: string;
}

export interface DeathRecord {
  cause: DeathCause;
  detail: string;
  daysSurvived: number;
  season: Season;
}

export interface GameState {
  name: string;
  kit: Kit;
  dayOfYear: number;
  hour: number;
  daysSurvived: number;
  year: number;
  season: Season;
  weather: Weather;
  locationId: LocationId;
  knownLocations: LocationId[];
  meters: Meters;
  inventory: Inventory;
  traits: Traits;
  standing: Record<string, number>;
  seenEncounterIds: EncounterId[];
  seenDialogueIds: string[];
  presentCharacterId: CharacterId | null;
  activeEncounterId: EncounterId | null;
  log: LogEntry[];
  skirmish: SkirmishState | null;
  campfire: boolean;
  /** Hours of burn left. Missing on older saves — treat a live fire as a few hours remaining. */
  campfireHours?: number;
  dead: DeathRecord | null;
  rngSeed: number;
}

export type SkirmishMove = "fire" | "close" | "cover" | "item" | "flee";

export type GameAction =
  | { type: "travel"; to: LocationId }
  | { type: "eat" }
  | { type: "drink" }
  | { type: "sleep" }
  | { type: "search" }
  | { type: "wait" }
  | { type: "talk" }
  | { type: "makeFire" }
  | { type: "gatherWater" }
  | { type: "gatherWood" }
  | { type: "hunt" }
  | { type: "fish" }
  | { type: "scout" }
  | { type: "mend" }
  | { type: "checkSnares" }
  | { type: "cache" }
  | { type: "tendFire" }
  | { type: "shelterUp" }
  | { type: "pray" }
  | { type: "restWatch" }
  | { type: "encounterChoice"; optionId: string }
  | { type: "skirmish"; move: SkirmishMove };

export interface Choice {
  id: string;
  label: string;
  disabled?: boolean;
  hint?: string;
  action: GameAction;
}

export interface Outcome {
  text: string;
  hours?: number;
  meters?: Partial<Meters>;
  inventory?: Partial<{
    rations: number;
    water: number;
    firewood: number;
    pelts: number;
    powder: number;
  }>;
  extraAdd?: string;
  extraRemove?: string;
  standing?: { id: CharacterId; delta: number };
  startSkirmish?: Omit<SkirmishState, "playerCover" | "awaiting">;
  unlockLocation?: LocationId;
  presentCharacter?: CharacterId | null;
  death?: { cause: DeathCause; detail: string };
  markDialogue?: string;
  /** A choice can turn the wind or let a storm arrive. */
  weather?: Weather;
  /** Force a move (chase, flee, follow smoke). */
  relocate?: LocationId;
  /** After resolving, immediately begin this encounter if it exists. */
  followUpEncounter?: EncounterId;
  clearFire?: boolean;
  /** Extra sentence; concatenated onto `text` when applying. */
  scene?: string;
}

export interface EncounterChoice {
  id: string;
  label: string;
  check?: { trait: Trait; dc: number };
  success?: Outcome;
  fail?: Outcome;
  outcome?: Outcome;
}

export interface EncounterDef {
  id: EncounterId;
  season?: Season | Season[];
  locations?: LocationId[] | "any";
  weather?: Weather[];
  characterId?: CharacterId;
  weight?: number;
  text: string;
  choices: EncounterChoice[];
  timeBands?: TimeBand[];
  locationTags?: LocationTag[];
  triggers?: EncounterTrigger[];
  /** If true, `seenEncounterIds` will not block this beat. Default false. */
  repeatable?: boolean;
}

export interface Connection {
  to: LocationId;
  hours: number;
  trailName: string;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  art: string;
  blurb: string;
  tags: LocationTag[];
  connections: Connection[];
}

export interface DialogueNode {
  id: string;
  seasons?: Season[];
  minStanding?: number;
  requiresExtra?: string;
  unlessExtra?: string;
  text: string;
  choices: EncounterChoice[];
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  art: string;
  home: LocationId[];
  seasons: Season[] | "all";
  blurb: string;
  fallback: string;
  nodes: DialogueNode[];
}

export const DAYS_PER_SEASON = 30;
export const DAYS_PER_YEAR = 120;
export const METER_MAX = 100;

export function timeBand(hour: number): TimeBand {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 20 || h <= 4) return "night";
  if (h <= 7) return "dawn";
  if (h <= 11) return "morning";
  if (h <= 16) return "afternoon";
  return "dusk";
}
