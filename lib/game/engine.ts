import {
  addCampExtra,
  addToPack,
  atOwnCamp,
  buildHours,
  cacheCap,
  canCook,
  canPitch,
  canStartJob,
  cloneCamp,
  emptyCamp,
  firewoodCap,
  jobHours,
  jobLabel,
  packLeftover,
  packRoom,
  readyJobLine,
  recoverOnStrike,
  spendFromPackOrCache,
  tickCampHour,
} from "@/lib/game/camp";
import {
  cacheCopy,
  campChoices,
  drinkCopy,
  eatCopy,
  fireCopy,
  fishCopy,
  hasShelter,
  huntCopy,
  mendCopy,
  prayCopy,
  restWatchCopy,
  scoutCopy,
  shelterCopy,
  sleepCopy,
  snaresCopy,
  tendCopy,
} from "@/lib/game/content/actions";
import { CHARACTER_BY_ID, CHARACTERS } from "@/lib/game/content/characters";
import { arrivalParagraph, choreEncounter, choreKindFromId, forageOutcome, waitFlavor } from "@/lib/game/content/chores";
import { allEncounters } from "@/lib/game/content/index";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { pickOpening } from "@/lib/game/content/openings";
import { packCap, practiceSkill, skilledDc } from "@/lib/game/progress";
import { deathSentence, JOURNAL_KEEP, trailHours } from "@/lib/game/readout";
import { interpretAttempt, shouldDispatchVerb } from "@/lib/game/attempt";
import { attemptOutcome, followUpScene, rememberStory } from "@/lib/game/improv";
import {
  chopBonus,
  craftTool,
  finishRaise,
  hasTool,
  maybeWreckHomestead,
  startRaise,
  stoneGround,
  workById,
} from "@/lib/game/homestead";
import { isLiveTalk, liveTalkEncounter } from "@/lib/game/talk";
import { peopleAt, placePerson, seedWorld, syncPresence, tickWorldHour } from "@/lib/game/world";
import { withBase } from "@/lib/paths";
import type {
  CampJob,
  CampPiece,
  CampStowItem,
  CharacterId,
  Choice,
  DeathCause,
  EncounterChoice,
  EncounterDef,
  EncounterTrigger,
  GameAction,
  GameState,
  Inventory,
  Kit,
  LocationId,
  LogEntry,
  Meters,
  Outcome,
  PendingRoll,
  RangeBand,
  RollResult,
  Season,
  SkirmishFoe,
  SkirmishMove,
  Trait,
  WaitScene,
  Weather,
} from "@/lib/game/types";
import { DAYS_PER_SEASON, DAYS_PER_YEAR, METER_MAX, timeBand } from "@/lib/game/types";
