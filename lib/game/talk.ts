import { characterOf, locationOf, placeTitle } from "@/lib/game/atlas";
import { GREET, NEED_ASK, TOPIC_LABEL, TOPIC_LINES, type TalkTopic } from "@/lib/game/content/voices";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  CharacterId,
  EncounterChoice,
  EncounterDef,
  GameState,
  Outcome,
  PersonLife,
  PersonNeed,
} from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function locHash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function lifeOf(state: GameState, id: CharacterId): PersonLife | null {
  return state.world?.people[id] ?? peopleAt(state).find((p) => p.id === id) ?? null;
}

function rngFor(state: GameState, id: CharacterId, salt: string) {
  return mulberry32(locHash(id) ^ locHash(salt) ^ locHash(state.locationId) ^ (state.dayOfYear * 1009 + state.hour * 17));
}

export function composeGreet(state: GameState, id: CharacterId): string {
  const person = characterOf(state, id) ?? CHARACTER_BY_ID[id];
  const life = lifeOf(state, id);
  const rng = rngFor(state, id, "greet");
  const greets = GREET[id];
  let line = greets?.length ? pick(rng, greets) : (person?.fallback ?? "They look at you and wait.");
  if (life?.need) {
    const ask = NEED_ASK[life.need];
    if (ask && rng() < 0.7) line = `${line} ${pick(rng, ask)}`;
  }
  const tags = state.memories?.[id] ?? [];
  if (tags.includes("shared-meat") && rng() < 0.5) {
    line = `${line} The meat you shared still sits between you.`;
  } else if (tags.includes("left-in-storm") && rng() < 0.6) {
    line = `${line} The storm you walked out of is still in their face.`;
  } else if (tags.includes("stole") && rng() < 0.6) {
    line = `${line} They look at your hands.`;
  } else if (tags.includes("sat-at-fire") && rng() < 0.4) {
    line = `${line} They nod at the idea of your fire.`;
  }
  const stand = state.standing[id] ?? 0;
  if (stand <= -2) line = `${line} They have not forgiven you.`;
  else if (stand >= 2) line = `${line} Something in them has decided you are not weather.`;
  return line;
}

const ANSWERED_NEED = "answered-need";

const ANSWER_LABEL: Record<PersonNeed, string> = {
  food: "Answer about meat",
  warmth: "Answer about a fire",
  trade: "Answer about a trade",
  shelter: "Answer about a wall",
  news: "Answer about who has come through",
  company: "Answer — sit with them a while",
};

function answeredNeed(state: GameState, id: CharacterId) {
  return (state.memories?.[id] ?? []).includes(ANSWERED_NEED);
}

/** The living question this face is asking, if any. */
export function npcNeed(state: GameState, id: CharacterId): PersonNeed | null {
  return lifeOf(state, id)?.need ?? null;
}

function needAnswerLine(state: GameState, id: CharacterId, success: boolean): string {
  const need = npcNeed(state, id);
  const name = characterOf(state, id)?.name ?? CHARACTER_BY_ID[id]?.name ?? "They";
  if (need === "food") {
    if (state.inventory.rations > 0) {
      return success
        ? `${name} watches you open the bag. “Then we eat. Hunger is a poor priest.” The strip changes hands.`
        : `${name} looks at the bag and then at your face. “Keep it. Pride chews slower than meat, but it chews.”`;
    }
    return success
      ? `${name} hears the empty bag without needing to see it. “Then we are the same animal. Sit anyway.”`
      : `${name} already knew. The question was whether you would lie about it. You did not even get that far.`;
  }
  if (need === "warmth") {
    return success
      ? `${name} nods at the idea of coal. “A fire is a country. You just let me in.”`
      : `${name} waits for heat that does not arrive. “Then we both stay weather a little longer.”`;
  }
  if (need === "trade") {
    return success
      ? `${name} names a price that is almost fair. Hands move. The hour is a ledger with a pulse.`
      : `${name} hears what you can spare and files it as nothing. “Come back when the pack has a mouth.”`;
  }
  if (need === "shelter") {
    return success
      ? `${name} looks at whatever roof you have and decides it will do. “Wind can argue with the wall. Not with me.”`
      : `${name} measures the open and does not step in. “A wall that is only talk is still weather.”`;
  }
  if (need === "news") {
    return success
      ? `${name} takes the names you have and keeps two. “That is enough to walk on. The rest is decoration.”`
      : `${name} wanted a name and got weather. “Then I will keep asking the trail. It lies less.”`;
  }
  if (need === "company") {
    return success
      ? `${name} lets the silence sit between you like a third cup. “Stay. I will not make it a treaty.”`
      : `${name} already knew you were only passing. A nod. The country takes the rest of the sentence.`;
  }
  return success
    ? `${name} hears you out. The question gets an answer, which is rarer than meat.`
    : `${name} asked, and the hour does not quite answer. They file your face under weather.`;
}

function topicReply(state: GameState, id: CharacterId, topic: TalkTopic): string {
  const rng = rngFor(state, id, topic);
  let line = pick(rng, TOPIC_LINES[topic]);
  const life = lifeOf(state, id);
  if (topic === "them" && life?.errand) {
    line = `${line} Today: ${life.errand}.`;
  }
  if (topic === "trail") {
    const loc = locationOf(state, state.locationId);
    const edge = loc?.connections[Math.floor(rng() * (loc.connections.length || 1))];
    if (edge) {
      const dest = placeTitle(state, edge.to);
      line = `${line} They mention ${dest} like a dare.`;
    }
  }
  if (topic === "meat" && state.inventory.rations <= 0) {
    line = "They see the empty bag. No speech. Hunger has already spoken.";
  }
  if (life?.need && topic !== "leave" && !answeredNeed(state, id)) {
    line = `${line} ${needAnswerLine(state, id, topic === "meat" || topic === "you" || topic === "them")}`;
  }
  return line;
}

function topicOutcome(state: GameState, id: CharacterId, topic: TalkTopic): Outcome {
  const text = topicReply(state, id, topic);
  if (topic === "leave") {
    return { text, hours: 1 };
  }
  if (topic === "meat" && state.inventory.rations > 0) {
    return {
      text,
      hours: 1,
      inventory: { rations: -1 },
      meters: { hunger: 4 },
      standing: { id, delta: 1 },
      remember: { id, tag: "shared-meat" },
    };
  }
  if (topic === "you") {
    return { text, hours: 1, standing: { id, delta: 1 } };
  }
  if (topic === "them") {
    return { text, hours: 1, standing: { id, delta: 1 } };
  }
  return { text, hours: 1 };
}

export function liveTalkId(id: CharacterId) {
  return `dlg-live-${id}`;
}

export function isLiveTalk(encounterId: string | null | undefined) {
  return Boolean(encounterId && encounterId.startsWith("dlg-live-"));
}

export function liveTalkCharacterId(encounterId: string | null | undefined): CharacterId | null {
  if (!isLiveTalk(encounterId) || !encounterId) return null;
  const id = encounterId.slice("dlg-live-".length);
  return id ? (id as CharacterId) : null;
}

/** A rolled NPC answer keeps the same mouth on the dock. Small talk may return to idle. */
export function liveTalkContinues(encounterId: string | null | undefined, optionId: string) {
  return isLiveTalk(encounterId) && optionId === "answer";
}

function answerNeedChoice(state: GameState, id: CharacterId): EncounterChoice | null {
  const need = npcNeed(state, id);
  if (!need || answeredNeed(state, id)) return null;
  return {
    id: "answer",
    label: ANSWER_LABEL[need],
    check: { trait: "savvy", dc: 12 },
    success: {
      text: needAnswerLine(state, id, true),
      hours: 1,
      standing: { id, delta: 1 },
      remember: { id, tag: ANSWERED_NEED },
      inventory: need === "food" && state.inventory.rations > 0 ? { rations: -1 } : undefined,
      meters: need === "food" && state.inventory.rations > 0 ? { hunger: 4 } : undefined,
    },
    fail: {
      text: needAnswerLine(state, id, false),
      hours: 1,
      remember: { id, tag: ANSWERED_NEED },
    },
  };
}

export function liveTalkEncounter(state: GameState, id: CharacterId): EncounterDef {
  const topics: TalkTopic[] = ["weather", "trail", "them", "you", "leave"];
  if (state.inventory.rations > 0 || lifeOf(state, id)?.need === "food") {
    topics.splice(4, 0, "meat");
  }
  const choices: EncounterChoice[] = topics.map((topic) => ({
    id: topic,
    label: TOPIC_LABEL[topic],
    outcome: topicOutcome(state, id, topic),
  }));
  const answer = answerNeedChoice(state, id);
  if (answer) choices.unshift(answer);
  return {
    id: liveTalkId(id),
    characterId: id,
    repeatable: true,
    text: composeGreet(state, id),
    choices,
  };
}
